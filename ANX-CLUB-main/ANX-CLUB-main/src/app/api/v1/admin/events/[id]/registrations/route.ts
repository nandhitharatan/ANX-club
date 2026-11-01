import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
import { isOfficialAdminEmail } from '@/lib/admin-auth-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    const userEmail = (verifiedUser?.email || '').toLowerCase().trim();
    const isAdmin = verifiedUser?.role?.toLowerCase() === 'admin' ||
                    isOfficialAdminEmail(userEmail) ||
                    userEmail === 'admin@anxclub.dev' ||
                    verifiedUser?.uid === 'admin_user' ||
                    verifiedUser?.uid === 'admin_anx_core';

    if (!verifiedUser || !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Administrator privileges required.' }, { status: 403 });
    }

    try {
      const registrationsSnapshot = await adminDb.collection('eventRegistrations')
        .where('eventId', '==', params.id)
        .get();
        
      const registrations = registrationsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registeredAt: data.registeredAt?.toDate ? data.registeredAt.toDate().toISOString() : data.registeredAt || data.createdAt || new Date().toISOString()
        };
      });

      return NextResponse.json({ success: true, data: registrations, count: registrations.length }, { status: 200 });
    } catch (dbErr: any) {
      console.error(`[GET /api/v1/admin/events/${params.id}/registrations] Firestore error:`, dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: 'Database service unavailable. Unable to fetch registrations.' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching event registrations:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing registrations.' },
      { status: 500 }
    );
  }
}
