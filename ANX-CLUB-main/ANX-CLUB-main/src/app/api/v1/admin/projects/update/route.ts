import { NextResponse } from 'next/server';
import {adminDb} from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
const db = adminDb;

export async function POST(request: Request) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    if (!verifiedUser || verifiedUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const { projectId, status } = await request.json();

    if (!projectId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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

