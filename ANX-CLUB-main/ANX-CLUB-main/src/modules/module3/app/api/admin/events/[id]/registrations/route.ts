import { NextResponse } from 'next/server';
import {adminDb} from '@/lib/firebase/admin';
const db = adminDb;

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const registrationsSnapshot = await db.collection('eventRegistrations')
      .where('eventId', '==', params.id)
      .orderBy('createdAt', 'desc')
      .get();
      
    const registrations = registrationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(registrations);
  } catch (error: any) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: error.message || 'Error fetching registrations' }, { status: 500 });
  }
}
