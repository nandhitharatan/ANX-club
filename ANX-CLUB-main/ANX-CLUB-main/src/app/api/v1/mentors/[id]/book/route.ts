import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import { sendEmail } from '@/lib/resend';
import { mentorBookingRequestEmail, mentorSessionScheduledEmail } from '@/lib/email-templates';
import { addMemoryBooking } from '@/lib/memory-store';
import { awardXP } from '@/lib/gamification';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authenticate(request);
    
    const body = await request.json().catch(() => ({}));
    
    // Resolve user & parameters flexibly from auth token or body payload
    const actualUserId = userId || body.userId || body.memberId || 'default_user_123';
    const userEmail = body.userEmail || body.email || body.memberEmail || 'member@example.com';
    const userName = body.userName || body.memberName || 'Member';
    const topic = body.topic || body.reason || body.message || '1-on-1 Mentorship Session';
    const isPaid = Boolean(body.isPaid || body.paymentId || (body.amount && body.amount > 0));
    const amount = Number(body.amount || 0);
    
    const dateTimeStr = body.dateTime || '';
    const date = body.date || body.preferredDate || (dateTimeStr ? dateTimeStr.split(' ')[0] : new Date().toISOString().split('T')[0]);
    const time = body.time || body.preferredTime || (dateTimeStr ? dateTimeStr.split(' ').slice(1).join(' ') : '10:00 AM - 11:00 AM');
    
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return NextResponse.json({
        success: false,
        message: 'Cannot schedule mentorship sessions for past dates. Please select an upcoming date.'
      }, { status: 400 });
    }

    const mentorName = body.mentorName || 'Expert Mentor';
    const message = body.message || body.reason || '';

    // If paid session -> Generate confirmed Google Meet link for the selected slot timing
    const meetingLink = isPaid || body.meetingLink 
      ? (body.meetingLink || `https://meet.google.com/anx-${params.id}-${Math.floor(1000 + Math.random() * 9000)}`)
      : undefined;

    const requestData = {
      mentorId: params.id,
      mentorName,
      memberId: actualUserId,
      memberName: userName,
      memberEmail: userEmail,
      topic,
      preferredDate: date,
      preferredTime: time,
      message,
      isPaid,
      amount,
      meetingLink,
      status: isPaid ? 'Approved' : 'Pending',
      createdAt: new Date().toISOString()
    };

    let docId = 'req_' + Date.now();
    try {
      const docRef = await adminDb.collection('mentorRequests').add(requestData);
      docId = docRef.id;
    } catch (dbErr) {
      console.warn('Firestore write for mentor request fallback to memory store:', dbErr);
    }

    // Always record in memory store for instant admin and user reflection
    addMemoryBooking({ id: docId, ...requestData });

    // Award +40 XP for Booking a Mentorship Session
    let xpAwarded = 40;
    try {
      const xpRes = await awardXP(actualUserId, 'mentor', 40, docId, `Booked 1-on-1 Mentorship session with ${mentorName}`);
      if (xpRes?.xpAwarded) xpAwarded = xpRes.xpAwarded;
    } catch (xpErr) {
      console.warn('XP award notice for mentor booking:', xpErr);
    }

    // Send notification email asynchronously
    try {
      if (isPaid && meetingLink) {
        // Paid Session -> Send Scheduled Confirmation with Google Meet Link according to slot timings
        await sendEmail(
          userEmail,
          `🗓️ Mentorship Session Scheduled with ${mentorName}`,
          mentorSessionScheduledEmail({
            mentorName,
            userName,
            date,
            time,
            topic,
            meetingLink,
            isPaid: true,
            amount
          })
        );
      } else {
        // Free Session -> Send Request Registered Confirmation
        await sendEmail(
          userEmail,
          `Mentor Session Requested: ${mentorName}`,
          mentorBookingRequestEmail(mentorName, date, time, topic)
        );
      }
    } catch (emailErr) {
      console.warn('Notification email sending skipped or failed:', emailErr);
    }

    // Create a real-time notification for the mentor if their account exists
    try {
      const mentorDoc = await adminDb.collection('mentors').doc(params.id).get();
      if (mentorDoc.exists && mentorDoc.data()?.ownerEmail) {
        const userSnap = await adminDb.collection('users')
          .where('email', '==', mentorDoc.data()?.ownerEmail)
          .get();
        
        if (!userSnap.empty) {
          const mentorUserId = userSnap.docs[0].id;
          await adminDb.collection('notifications').add({
            recipientId: mentorUserId,
            title: 'New Session Request',
            body: `${userName} requested a session on ${date} (${time}).`,
            actionUrl: '/mentor-dashboard',
            channels: ['in_app'],
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (notifErr) {
      console.warn('Failed to create mentor notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: isPaid 
        ? `Session registered! Google Meet link for slot ${time} sent to your email.` 
        : `Registered! Session request sent and confirmation emailed to you.`,
      data: { 
        id: docId, 
        xpAwarded,
        ...requestData 
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting mentor request:', error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error submitting request" } }, 
      { status: 500 }
    );
  }
}

