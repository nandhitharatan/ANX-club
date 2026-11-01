import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { MOCK_MENTORS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    let mentors: any[] = [];
    try {
      const snapshot = await adminDb.collection('mentors')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      mentors = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (dbErr: any) {
      console.warn(`[GET /api/v1/mentors] Firestore query for mentors fallback: ${dbErr?.message || dbErr}`);
      mentors = MOCK_MENTORS as any[];
    }

    const response = NextResponse.json(mentors, { status: 200 });
    response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return response;
  } catch (error: any) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(MOCK_MENTORS, { status: 200 });
  }
}

