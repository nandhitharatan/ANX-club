import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import * as admin from 'firebase-admin';
import { awardXP } from '@/lib/gamification';

export async function POST(request: NextRequest, { params }: { params: { ideaId: string } }) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a mentor/admin
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData || (userData.role !== 'Admin' && userData.role !== 'Mentor')) {
      return NextResponse.json({ error: 'Forbidden: Requires Mentor or Admin role' }, { status: 403 });
    }

    const body = await request.json();
    const { status, feedback } = body;
    const { ideaId } = params;

    if (!status || !feedback) {
      return NextResponse.json({ error: 'Missing status or feedback' }, { status: 400 });
    }

    const ideaRef = adminDb.collection('ideas').doc(ideaId);
    const ideaSnap = await ideaRef.get();
    
    if (!ideaSnap.exists) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    await ideaRef.update({
      status,
      mentorFeedback: feedback,
      reviewedBy: userId,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If validated or launched, award massive XP to submitter/team
    if (status === 'Validated') {
      await awardXP(ideaSnap.data()!.submitterId, 'idea', 50, ideaId, 'Idea Validated by Mentor');
    } else if (status === 'Launched') {
      const { sendOmnichannelNotification } = await import('@/lib/notifications');
      const submitterId = ideaSnap.data()!.submitterId;
      const recipientIds = new Set<string>();
      if (submitterId) recipientIds.add(submitterId);

      const teamsSnap = await adminDb.collection('ideaTeams').where('ideaId', '==', ideaId).get();
      teamsSnap.forEach(teamDoc => {
        const members = teamDoc.data().members || [];
        members.forEach((mId: string) => {
          if (mId) recipientIds.add(mId);
        });
      });

      for (const memberId of Array.from(recipientIds)) {
        await awardXP(memberId, 'idea', 250, ideaId, 'Product Launched');
        await sendOmnichannelNotification({
          recipientId: memberId,
          title: 'Product Launched! +250 XP',
          body: 'Your incubation project was marked as Launched. You received 250 XP.',
          channels: ['in_app'],
          category: 'gamification'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Idea updated to ${status}`
    });
  } catch (error) {
    console.error('Error reviewing idea:', error);
    return NextResponse.json({ success: false, message: 'Failed to review idea' }, { status: 500 });
  }
}
