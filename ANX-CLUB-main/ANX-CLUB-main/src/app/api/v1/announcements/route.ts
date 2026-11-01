import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('announcements').orderBy('createdAt', 'desc').get();
    const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(announcements, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json([], { status: 500 });
  }
}
