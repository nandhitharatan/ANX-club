import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import { sendOmnichannelNotification } from '@/lib/notifications';
import type { Query } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: messageBody, cohort, channels } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'Missing title or message body' }, { status: 400 });
    }

    let usersQuery: Query = adminDb.collection('users');
    if (cohort && cohort !== 'all') {
      usersQuery = usersQuery.where('membershipType', '==', cohort);
    }
    
    const usersSnap = await usersQuery.get();
    
    const promises = usersSnap.docs.map(doc => {
      const userData = doc.data();
      return sendOmnichannelNotification({
        recipientId: doc.id,
        title,
        body: messageBody,
        channels: channels || ['in_app'],
        category: 'broadcast',
        emailContact: userData.email,
        whatsappContact: userData.phone || userData.mobile
      });
    });
    
    await Promise.allSettled(promises);

    return NextResponse.json({
      success: true,
      message: `Broadcast successfully dispatched to ${cohort || 'all'} cohort (${usersSnap.size} recipients).`
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send broadcast' }, { status: 500 });
  }
}
