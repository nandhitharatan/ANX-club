import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = await db.collection('mentors').doc(params.id).get();
    
    if (!docRef.exists) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    return NextResponse.json({ id: docRef.id, ...docRef.data() });
  } catch (error: any) {
    console.error('Error fetching mentor:', error);
    return NextResponse.json({ error: error.message || 'Error fetching mentor' }, { status: 500 });
  }
}
