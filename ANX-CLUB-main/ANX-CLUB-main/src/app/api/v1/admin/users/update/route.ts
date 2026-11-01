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

    const { targetUid, membershipType, membershipExpiry } = await request.json();

    if (!targetUid) {
      return NextResponse.json({ error: 'Missing targetUid' }, { status: 400 });
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

