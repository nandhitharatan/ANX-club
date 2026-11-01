import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendEventReminder } from '@/lib/notifications';

export async function GET(request: Request) {
  // This endpoint should be protected and only called by a trusted Cron service
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized: CRON_SECRET authorization required' }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Find events happening tomorrow
    const eventsSnapshot = await adminDb.collection('events')
      .where('date', '>=', tomorrowStart.toISOString())
      .where('date', '<=', tomorrowEnd.toISOString())
      .get();

    let notificationsSent = 0;

    for (const eventDoc of eventsSnapshot.docs) {
      const event = eventDoc.data();
      const eventId = eventDoc.id;

      // Find registrations for this event
      const registrationsSnapshot = await adminDb.collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .get();

      for (const regDoc of registrationsSnapshot.docs) {
        const reg = regDoc.data();
        
        // Lookup user to get contact info
        const userDoc = await adminDb.collection('users').doc(reg.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          await sendEventReminder(reg.userId, event.title, userData.email, userData.phoneNumber);
          notificationsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, notificationsSent });
  } catch (error: any) {
    console.error('Error processing cron notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
