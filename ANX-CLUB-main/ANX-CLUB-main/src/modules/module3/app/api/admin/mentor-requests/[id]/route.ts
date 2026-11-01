import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/resend';
import { mentorBookingApprovalEmail, generateICS } from '@/lib/email-templates';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!['Approved', 'Rejected', 'Completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const docRef = db.collection('mentorRequests').doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = docSnap.data() || {};

    let meetingLink = requestData.meetingLink;
    if (status === 'Approved' && !meetingLink) {
      meetingLink = `https://meet.jit.si/Mentorship-${params.id}-${Math.random().toString(36).substring(7)}`;
    }

    await docRef.update({ 
      status,
      ...(meetingLink ? { meetingLink } : {})
    });

    // Send email notification if approved or rejected
    if (status === 'Approved' || status === 'Rejected') {
      const emailStatus = status.toLowerCase() as 'approved' | 'rejected';
      
      const attachments = [];
      if (status === 'Approved') {
        const icsContent = generateICS(requestData.mentorName, requestData.preferredDate, requestData.preferredTime, requestData.topic, meetingLink);
        attachments.push({
          filename: 'invite.ics',
          content: icsContent,
        });
      }

      // Add in-app notification
      await db.collection('notifications').add({
        recipientId: requestData.memberId,
        title: `Mentor Session ${status}`,
        body: `Your mentoring session with ${requestData.mentorName} has been ${status.toLowerCase()}.`,
        isRead: false,
        actionUrl: '/dashboard',
        channels: ['in_app'],
        createdAt: new Date().toISOString()
      });

      await sendEmail(
        requestData.memberEmail, 
        `Mentor Session ${status}`, 
        mentorBookingApprovalEmail(requestData.mentorName, requestData.preferredDate, emailStatus, meetingLink),
        attachments
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error updating mentor request:', error);
    return NextResponse.json({ error: error.message || 'Error updating request' }, { status: 500 });
  }
}
