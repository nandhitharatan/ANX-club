import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/resend';
import { eventRegistrationEmail } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, userId, userEmail, userName, college, mobile, teamName, teamMembers } = body;

    if (!eventId || !userId || !userEmail || !userName || !teamName || !teamMembers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const registrationId = `${eventId}_${userId}`;
    const regRef = db.collection('eventRegistrations').doc(registrationId);
    const eventRef = db.collection('events').doc(eventId);

    // Run in a transaction to prevent overselling seats
    await db.runTransaction(async (transaction: any) => {
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data()!;
      
      // Basic validation
      if (eventData.price > 0 && eventData.premiumPrice > 0) {
        throw new Error('This event requires payment.');
      }
      
      if (eventData.registeredCount >= eventData.seats) {
        throw new Error('Event is fully booked.');
      }

      // Check if already registered
      const regDoc = await transaction.get(regRef);
      if (regDoc.exists) {
        throw new Error('You are already registered for this event.');
      }

      // Add registration
      transaction.set(regRef, {
        eventId,
        userId,
        userEmail,
        userName,
        college: college || '',
        mobile: mobile || '',
        teamName: teamName || '',
        teamMembers: teamMembers || '',
        paymentStatus: 'Free',
        createdAt: new Date().toISOString()
      });

      // Increment registeredCount
      transaction.update(eventRef, {
        registeredCount: (eventData.registeredCount || 0) + 1
      });
    });

    // Send email outside the transaction to avoid blocking it
    const finalEventDoc = await eventRef.get();
    const eventTitle = finalEventDoc.exists ? finalEventDoc.data()?.title : 'the event';
    
    try {
      await sendEmail(userEmail, "Event Registration Confirmed", eventRegistrationEmail(eventTitle, userName));
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
      // We don't fail the registration if the email fails.
    }

    // Create a real-time notification for the user
    try {
      const { sendOmnichannelNotification } = await import('@/lib/notifications');
      await sendOmnichannelNotification({
        recipientId: userId,
        title: 'Event Registration Successful',
        body: `You are confirmed for ${eventTitle}.`,
        actionUrl: `/events/${eventId}`,
        channels: ['in_app'],
        category: 'event'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error in event registration:', error);
    return NextResponse.json({ error: error.message || 'Error registering for event' }, { status: 500 });
  }
}
