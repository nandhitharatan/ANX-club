import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const docRef = await adminDb.collection('mentors').doc(params.id).get();
    
    if (!docRef.exists) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: 'Mentor not found' } }, { status: 404 });
    }

    return NextResponse.json({ id: docRef.id, ...docRef.data() });
  } catch (error: any) {
    console.error('Error fetching mentor:', error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: 'Error fetching mentor' } }, { status: 500 });
  }
}
