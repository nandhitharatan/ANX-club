import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/resend';
import { eventRegistrationEmail } from '@/lib/email-templates';
import { z } from 'zod';

const registrationSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  college: z.string().optional(),
  mobile: z.string().optional(),
  teamName: z.string().min(1),
  teamMembers: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid required fields', details: parsed.error.format() }, { status: 400 });
    }
    const { eventId, userId, userEmail, userName, college, mobile, teamName, teamMembers } = parsed.data;

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
      if (eventData.isActive === false || eventData.status === 'Deleted') {
        throw new Error('Event not found or removed.');
      }
      if (eventData.status === 'Cancelled') {
        throw new Error('This event has been cancelled.');
      }
      if (eventData.status === 'Draft' || eventData.isPublished === false) {
        throw new Error('This event is currently unpublished.');
      }
      
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

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully registered for event. XP will be awarded upon attendance check-in.' 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in event registration:', error);
    return NextResponse.json({ error: error.message || 'Error registering for event' }, { status: 500 });
  }
}
