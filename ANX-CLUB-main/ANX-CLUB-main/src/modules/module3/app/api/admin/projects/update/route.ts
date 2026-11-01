import { NextResponse } from 'next/server';
import {adminDb} from '@/lib/firebase/admin';
const db = adminDb;

export async function POST(request: Request) {
  try {
    const { adminUid, projectId, status } = await request.json();

    if (!adminUid || !projectId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Basic security check: ensure requester is an admin
    const adminDoc = await db.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    // Update project
    await db.collection('projects').doc(projectId).update({
      approvalStatus: status
    });

    return NextResponse.json({ success: true, message: `Project ${status} successfully` });
  } catch (error: any) {
    console.error('Admin Project Update Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
