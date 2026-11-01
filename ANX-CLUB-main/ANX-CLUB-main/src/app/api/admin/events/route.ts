import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const q = db.collection('events').orderBy('createdAt', 'desc');
    const eventsSnapshot = await q.get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching admin events:', error);
    return NextResponse.json({ error: error.message || 'Error fetching events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, date, type, price, premiumPrice, memberOnly, speaker, seats, imageUrl } = body;

    if (!title || !date || !type || !seats) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventData = {
      title,
      description: description || '',
      date,
      type,
      price: Number(price) || 0,
      premiumPrice: Number(premiumPrice) || 0,
      memberOnly: Boolean(memberOnly),
      speaker: speaker || '',
      seats: Number(seats) || 0,
      registeredCount: 0,
      imageUrl: imageUrl || '',
      status: 'Approved', // Admin created events are automatically approved
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('events').add(eventData);

    return NextResponse.json({ id: docRef.id, ...eventData }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message || 'Error creating event' }, { status: 500 });
  }
}
