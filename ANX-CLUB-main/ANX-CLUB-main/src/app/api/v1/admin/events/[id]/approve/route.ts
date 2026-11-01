import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
    }

    const docRef = adminDb.collection('events').doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: 'Event not found' } }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body; // 'Approve' or 'Reject'

    if (action === 'Approve') {
      await docRef.update({ status: 'Approved' });
    } else if (action === 'Reject') {
      await docRef.update({ status: 'Rejected' });
    } else {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: 'Invalid action' } }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: action === 'Approve' ? 'Approved' : 'Rejected' });
  } catch (error: any) {
    console.error('Error updating event status:', error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: 'Error updating event' } }, { status: 500 });
  }
}
