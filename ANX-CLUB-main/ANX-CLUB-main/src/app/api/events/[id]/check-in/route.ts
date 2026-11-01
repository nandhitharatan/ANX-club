import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import * as admin from 'firebase-admin';
import { awardEventAttendanceXP } from '@/lib/gamification';
import { sendOmnichannelNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // 1. Fetch Event Details
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    const eventData = eventDoc.data()!;

    // 2. Find registration record for this user and event
    const regQuery = await adminDb.collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (regQuery.empty) {
      return NextResponse.json({ error: 'No active registration found for this event' }, { status: 404 });
    }

    const regDoc = regQuery.docs[0];
    const regData = regDoc.data();

    // 3. Check if already checked in
    if (regData.attended) {
      return NextResponse.json({
        success: true,
        message: 'Already checked in for this event',
        alreadyAttended: true
      }, { status: 200 });
    }

    // 4. Mark attendance in registration
    await regDoc.ref.update({
      attended: true,
      attendedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'attended'
    });

    // 5. Award +50 XP for physical/live attendance per PRD v2
    const { xpAwarded, duplicate } = await awardEventAttendanceXP(userId, eventId, eventData.title || 'Event');

    // 6. Send in-app notification
    await sendOmnichannelNotification({
      recipientId: userId,
      title: 'Event Check-In Confirmed! (+50 XP)',
      body: `You successfully checked in to "${eventData.title}". +50 XP has been added to your ledger.`,
      channels: ['in_app'],
      category: 'event'
    });

    // 7. Auto-issue certificate if event is certificate-eligible
    let certificateIssued = false;
    if (eventData.certificateEligible) {
      try {
        const origin = new URL(request.url).origin;
        const certRes = await fetch(`${origin}/api/certificates/issue`, {
          method: 'POST',
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            memberId: userId,
            recipientName: regData.name || regData.userName || 'Member',
            title: `Certificate of Attendance: ${eventData.title}`,
            templateType: 'event_attendance'
          })
        });
        if (certRes.ok) certificateIssued = true;
      } catch (certErr) {
        console.warn('Certificate auto-issue async skipped:', certErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance confirmed and +50 XP awarded!',
      xpAwarded,
      certificateIssued
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error during event check-in:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
