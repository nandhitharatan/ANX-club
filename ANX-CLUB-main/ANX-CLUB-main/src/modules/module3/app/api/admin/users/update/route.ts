import { NextResponse } from 'next/server';
import {adminDb} from '@/lib/firebase/admin';
const db = adminDb;

export async function POST(request: Request) {
  try {
    const { adminUid, targetUid, membershipType, membershipExpiry } = await request.json();

    if (!adminUid || !targetUid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic security check: ensure requester is an admin
    const adminDoc = await db.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    // Prepare update payload
    const updateData: any = {};
    if (membershipType !== undefined) updateData.membershipType = membershipType;
    if (membershipExpiry !== undefined) updateData.membershipExpiry = membershipExpiry;

    await db.collection('users').doc(targetUid).update(updateData);

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Admin User Update Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
