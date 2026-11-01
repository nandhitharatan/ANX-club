import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    const userEmail = (verifiedUser?.email || '').toLowerCase().trim();
    const isAdmin = verifiedUser?.role === 'Admin' || 
                    userEmail === 'admin@anxclub.dev' ||
                    userEmail === 'admin@algorithmaliens.com' || 
                    userEmail === 'admin@anx.club' ||
                    userEmail === 'admin@algoritmaliens.com' ||
                    userEmail === 'sairamraopolsani@gmail.com' ||
                    verifiedUser?.uid === 'admin_user' ||
                    verifiedUser?.uid === 'admin_anx_core';

    if (!verifiedUser || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
