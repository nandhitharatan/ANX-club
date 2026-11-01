import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const q = db.collection('mentors').orderBy('createdAt', 'desc');
    const mentorsSnapshot = await q.get();
    const mentors = mentorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(mentors);
  } catch (error: any) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: error.message || 'Error fetching mentors' }, { status: 500 });
  }
}
