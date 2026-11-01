import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = db.collection('events').doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body; // 'Approve' or 'Reject'

    if (action === 'Approve') {
      await docRef.update({ status: 'Approved' });
    } else if (action === 'Reject') {
      await docRef.update({ status: 'Rejected' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: action === 'Approve' ? 'Approved' : 'Rejected' });
  } catch (error: any) {
    console.error('Error updating event status:', error);
    return NextResponse.json({ error: error.message || 'Error updating event' }, { status: 500 });
  }
}
