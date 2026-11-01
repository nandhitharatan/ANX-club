import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const snapshot = await adminDb.collection('reviews').where('mentorId', '==', params.id).get();
    const reviews = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: 'Failed to fetch reviews' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authenticate(request);
    const body = await request.json();
    const { rating, comment, memberName } = body;
    
    const actualMemberId = userId || body.memberId;

    if (!rating || !actualMemberId || !memberName) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: 'Missing required fields' } }, { status: 400 });
    }

    const reviewData = {
      mentorId: params.id,
      memberId: actualMemberId,
      memberName,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('reviews').add(reviewData);

    return NextResponse.json({ success: true, data: { id: docRef.id, ...reviewData } }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding review:', error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: 'Failed to add review' } }, { status: 500 });
  }
}
