import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import * as admin from 'firebase-admin';
import { awardXP } from '@/lib/gamification';

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ideaId, goal, durationWeeks = 2 } = body;

    if (!ideaId || !goal) {
      return NextResponse.json({ error: 'Missing ideaId or goal' }, { status: 400 });
    }

    const ideaRef = adminDb.collection('ideas').doc(ideaId);
    const ideaSnap = await ideaRef.get();
    
    if (!ideaSnap.exists) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const sprintRef = adminDb.collection('sprints').doc();
    const sprintData = {
      id: sprintRef.id,
      ideaId,
      goal,
      durationWeeks,
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const batch = adminDb.batch();
    batch.set(sprintRef, sprintData);
    batch.update(ideaRef, { status: 'Building' });
    await batch.commit();

    // Award XP for starting a sprint (e.g., +20 XP)
    await awardXP(userId, 'idea', 20, sprintRef.id, 'Started a new sprint');

    return NextResponse.json({
      success: true,
      message: 'Sprint started successfully',
      sprintId: sprintRef.id
    });
  } catch (error) {
    console.error('Error creating sprint:', error);
    return NextResponse.json({ success: false, message: 'Failed to start sprint' }, { status: 500 });
  }
}
