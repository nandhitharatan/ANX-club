import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const q = db.collection('communityTopics').orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json(topics);
  } catch (error: any) {
    console.error('Error fetching community topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type, tags, authorId, authorName } = body;

    if (!title || !content || !type || !authorId || !authorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const topicData = {
      title,
      content,
      type, // 'Discussion', 'Question', 'Team Matchmaking'
      tags: tags || [],
      authorId,
      authorName,
      createdAt: new Date().toISOString(),
      repliesCount: 0
    };

    const docRef = await db.collection('communityTopics').add(topicData);

    return NextResponse.json({ id: docRef.id, ...topicData }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding community topic:', error);
    return NextResponse.json({ error: error.message || 'Failed to add topic' }, { status: 500 });
  }
}
