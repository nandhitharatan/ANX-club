import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const q = db.collection('reviews').where('mentorId', '==', params.id);
    const snapshot = await q.get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { rating, comment, memberId, memberName } = body;

    if (!rating || !memberId || !memberName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reviewData = {
      mentorId: params.id,
      memberId,
      memberName,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('reviews').add(reviewData);

    return NextResponse.json({ id: docRef.id, ...reviewData }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding review:', error);
    return NextResponse.json({ error: error.message || 'Failed to add review' }, { status: 500 });
  }
}
