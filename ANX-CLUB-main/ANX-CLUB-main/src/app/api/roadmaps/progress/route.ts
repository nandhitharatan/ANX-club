import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';
import { getRoadmapById } from '@/lib/roadmaps';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const actualUserId = userId || searchParams.get('userId');

    if (!actualUserId) {
      return NextResponse.json({ progress: {} });
    }

    const snapshot = await adminDb.collection('roadmapProgress')
      .where('userId', '==', actualUserId)
      .get();

    const progress: Record<string, string[]> = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.roadmapId && Array.isArray(data.completedStepIds)) {
        progress[data.roadmapId] = data.completedStepIds;
      }
    });

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    console.error('Error fetching roadmap progress:', error);
    return NextResponse.json({ success: false, progress: {} }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUserId = await authenticate(request);
    const body = await request.json().catch(() => ({}));
    const userId = authUserId || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User authentication required.' }, { status: 401 });
    }

    const { roadmapId, completedStepIds, stepId, isCompleted } = body;
    if (!roadmapId) {
      return NextResponse.json({ error: 'Missing roadmapId parameter.' }, { status: 400 });
    }

    const docId = `${userId}_${roadmapId}`;
    const docRef = adminDb.collection('roadmapProgress').doc(docId);
    const docSnap = await docRef.get();

    let newSteps: string[] = [];
    if (Array.isArray(completedStepIds)) {
      newSteps = completedStepIds;
    } else if (stepId) {
      const current = docSnap.exists ? (docSnap.data()?.completedStepIds || []) : [];
      if (isCompleted) {
        newSteps = current.includes(stepId) ? current : [...current, stepId];
      } else {
        newSteps = current.filter((id: string) => id !== stepId);
      }
    }

    const progressData = {
      userId,
      roadmapId,
      completedStepIds: newSteps,
      lastActiveTimestamp: new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(progressData, { merge: true });

    // Check if roadmap is fully completed to award XP
    let xpAwarded = 0;
    try {
      let targetRoadmap: any = getRoadmapById(roadmapId);
      if (!targetRoadmap) {
        const rmDoc = await adminDb.collection('roadmaps').doc(roadmapId).get();
        if (rmDoc.exists) targetRoadmap = rmDoc.data();
      }

      if (targetRoadmap && Array.isArray(targetRoadmap.steps) && targetRoadmap.steps.length > 0) {
        if (newSteps.length >= targetRoadmap.steps.length) {
          const xpResult = await awardXP(
            userId,
            'roadmap',
            40,
            roadmapId,
            `Completed all milestones for ${targetRoadmap.title || 'Roadmap'}`
          );
          xpAwarded = xpResult.xpAwarded;
        }
      }
    } catch (xpErr) {
      console.warn('Gamification roadmap XP award notification:', xpErr);
    }

    return NextResponse.json({
      success: true,
      roadmapId,
      completedStepIds: newSteps,
      xpAwarded,
      message: xpAwarded > 0 ? '🎉 Roadmap completed! +40 XP awarded.' : 'Progress saved successfully.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error saving roadmap progress:', error);
    return NextResponse.json({ error: error.message || 'Failed to update roadmap progress.' }, { status: 500 });
  }
}
