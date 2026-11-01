import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export type ActionType = 'event' | 'mentor' | 'idea' | 'referral' | 'internship' | 'roadmap';

export function calculateLeadershipStage(xp: number): string {
  if (xp >= 3000) return 'Director';
  if (xp >= 1500) return 'Core Team';
  if (xp >= 750) return 'Dept Head';
  if (xp >= 350) return 'Lead';
  if (xp >= 100) return 'Associate';
  return 'Member';
}

export async function awardXP(userId: string, actionType: ActionType, xpValue: number, sourceRefId: string, reason: string) {
  return adminDb.runTransaction(async (tx) => {
    // Idempotency check
    const existing = await tx.get(
      adminDb.collection('xpLedger')
        .where('userId', '==', userId)
        .where('actionType', '==', actionType)
        .where('sourceRefId', '==', sourceRefId)
        .limit(1)
    );
    
    if (!existing.empty) {
      return { xpAwarded: 0, duplicate: true };
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await tx.get(userRef);
    
    if (!userSnap.exists) {
      throw new Error('USER_NOT_FOUND');
    }
    
    const userData = userSnap.data() || {};
    const currentXP = userData.xpTotal || 0;
    const newXP = currentXP + xpValue;
    const newStage = calculateLeadershipStage(newXP);

    const ledgerRef = adminDb.collection('xpLedger').doc();
    
    tx.set(ledgerRef, {
      id: ledgerRef.id,
      userId,
      actionType,
      xpValue,
      sourceRefId,
      reason,
      awardedBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.update(userRef, { 
      xpTotal: newXP, 
      leadershipStage: newStage 
    });

    return { xpAwarded: xpValue, newTotal: newXP, newStage, duplicate: false };
  });
}

// PRD v2 Trigger Helpers
export async function awardEventAttendanceXP(userId: string, eventId: string, eventTitle: string) {
  return awardXP(userId, 'event', 50, eventId, `Attended event: ${eventTitle}`);
}

export async function awardMentorSessionXP(userId: string, requestId: string, mentorName: string) {
  return awardXP(userId, 'mentor', 75, requestId, `Completed mentorship session with ${mentorName}`);
}

export async function awardIdeaSubmittedXP(userId: string, ideaId: string, title: string) {
  return awardXP(userId, 'idea', 30, ideaId, `Submitted product idea: ${title}`);
}

export async function awardProductShippedXP(userId: string, ideaId: string, title: string) {
  return awardXP(userId, 'idea', 250, ideaId, `Shipped product: ${title}`);
}

export async function awardRoadmapMilestoneXP(userId: string, roadmapId: string, stepId: string) {
  return awardXP(userId, 'roadmap', 40, `${roadmapId}_${stepId}`, `Completed roadmap milestone: ${stepId}`);
}

export async function awardReferralXP(referrerId: string, refereeId: string) {
  return awardXP(referrerId, 'referral', 100, `ref_${refereeId}`, `Referred user: ${refereeId}`);
}
