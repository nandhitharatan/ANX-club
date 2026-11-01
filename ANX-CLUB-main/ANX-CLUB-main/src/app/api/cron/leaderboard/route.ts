import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    // 1. Verify authorization (e.g., via a CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: CRON_SECRET authorization required' }, { status: 401 });
    }

    // 2. Query top users from Firestore
    // Using adminDb to query users collection, ordered by xpTotal descending
    const usersSnapshot = await adminDb
      .collection('users')
      .orderBy('xpTotal', 'desc')
      .limit(100) // Assuming top 100 for global leaderboard
      .get();

    const rankings: any[] = [];
    let currentRank = 1;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include users who have at least 1 XP to filter out inactive ones if needed
      if ((data.xpTotal || 0) > 0) {
        rankings.push({
          rank: currentRank,
          userId: doc.id,
          fullName: data.fullName || 'Anonymous',
          xp: data.xpTotal || 0,
        });
        currentRank++;
      }
    });

    if (rankings.length === 0) {
      return NextResponse.json({ message: 'No active users found for leaderboard' }, { status: 200 });
    }

    // 3. Create the leaderboard snapshot documents
    const batch = adminDb.batch();
    const allTimeRef = adminDb.collection('leaderboardSnapshots').doc();
    batch.set(allTimeRef, {
      id: allTimeRef.id,
      scope: 'global',
      period: 'all_time',
      rankings,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const weeklyRef = adminDb.collection('leaderboardSnapshots').doc();
    batch.set(weeklyRef, {
      id: weeklyRef.id,
      scope: 'global',
      period: 'weekly',
      rankings, // TODO: Aggregate from xpLedger for accurate weekly
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const monthlyRef = adminDb.collection('leaderboardSnapshots').doc();
    batch.set(monthlyRef, {
      id: monthlyRef.id,
      scope: 'global',
      period: 'monthly',
      rankings, // TODO: Aggregate from xpLedger for accurate monthly
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard snapshot generated successfully',
      snapshotId: allTimeRef.id,
      totalRanked: rankings.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error generating leaderboard snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
