import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, actionType, xpValue, sourceRefId, reason, awardedBy } = body;

    if (!userId || !actionType || !xpValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);
    const xpLedgerRef = adminDb.collection('xpLedger').doc();

    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const newXpTotal = (userData?.xpTotal || 0) + xpValue;

      // Log the transaction
      transaction.set(xpLedgerRef, {
        id: xpLedgerRef.id,
        userId,
        actionType,
        xpValue,
        sourceRefId: sourceRefId || null,
        reason: reason || null,
        awardedBy: awardedBy || 'system',
        createdAt: new Date().toISOString(),
      });

      // Update user's total XP
      transaction.update(userRef, {
        xpTotal: newXpTotal,
      });
    });

    return NextResponse.json({ success: true, message: `Granted ${xpValue} XP to user ${userId}` }, { status: 200 });

  } catch (error: any) {
    console.error('Error granting XP:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
