import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: CRON_SECRET authorization required' }, { status: 401 });
    }

    // 1. Calculate MAM (Monthly Active Members)
    // defined as users who attended events, booked mentors, or submitted code in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const [recentRegistrations, recentMentorReqs, recentIdeas] = await Promise.all([
      adminDb.collection('eventRegistrations').where('createdAt', '>=', thirtyDaysAgoISO).get(),
      adminDb.collection('mentorRequests').where('createdAt', '>=', thirtyDaysAgoISO).get(),
      adminDb.collection('ideas').where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo)).get()
    ]);

    const activeUserIds = new Set<string>();
    recentRegistrations.forEach(doc => activeUserIds.add(doc.data().userId || doc.data().memberId));
    recentMentorReqs.forEach(doc => activeUserIds.add(doc.data().userId || doc.data().memberId));
    recentIdeas.forEach(doc => activeUserIds.add(doc.data().submitterId));

    const mam = activeUserIds.size;

    // 2. Counts
    const usersSnapshot = await adminDb.collection('users').get();
    const totalUsers = usersSnapshot.size;
    let premiumUsers = 0;
    usersSnapshot.forEach(doc => {
      if (doc.data().membershipType === 'premium' || doc.data().membershipType === 'Premium') premiumUsers++;
    });

    const eventsSnapshot = await adminDb.collection('events').get();
    const totalEvents = eventsSnapshot.size;

    const resourcesSnapshot = await adminDb.collection('resources').get();
    const totalResources = resourcesSnapshot.size;

    // 3. MRR Calculation
    const mrrSnapshot = await adminDb.collection('memberships').where('status', '==', 'active').get();
    let mrr = 0;
    mrrSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.amount) mrr += (data.amount / 12); // rough estimate if amount is yearly
    });

    // Save snapshot
    const dateStr = new Date().toISOString().split('T')[0];
    await adminDb.collection('analyticsSnapshots').doc(dateStr).set({
      date: dateStr,
      totalUsers,
      premiumUsers,
      totalEvents,
      totalResources,
      mam,
      mrr: Math.round(mrr),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Analytics snapshot generated successfully',
      snapshotId: dateStr
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error generating analytics snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
