import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/resend';
import { mentorBookingRequestEmail } from '@/lib/email-templates';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { userId, userEmail, userName, mentorName, topic, date, time, message } = body;

    if (!userId || !userEmail || !topic || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const requestData = {
      mentorId: params.id,
      mentorName,
      memberId: userId,
      memberName: userName,
      memberEmail: userEmail,
      topic,
      preferredDate: date,
      preferredTime: time,
      message,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('mentorRequests').add(requestData);

    // Send notification email to the member
    await sendEmail(userEmail, "Mentor Session Requested", mentorBookingRequestEmail(mentorName, date));

    // Create a real-time notification for the mentor if their account exists
    try {
      const mentorDoc = await db.collection('mentors').doc(params.id).get();
      if (mentorDoc.exists && mentorDoc.data()?.ownerEmail) {
        const userSnap = await db.collection('users').where('email', '==', mentorDoc.data()?.ownerEmail).get();
        
        if (!userSnap.empty) {
          const mentorUserId = userSnap.docs[0].id;
          await db.collection('notifications').add({
            recipientId: mentorUserId,
            title: 'New Session Request',
            body: `${userName} requested a session on ${date}.`,
            actionUrl: '/mentor-dashboard',
            channels: ['in_app'],
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to create mentor notification:', notifErr);
    }

    return NextResponse.json({ id: docRef.id, ...requestData }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting mentor request:', error);
    return NextResponse.json({ error: error.message || 'Error submitting request' }, { status: 500 });
  }
}
