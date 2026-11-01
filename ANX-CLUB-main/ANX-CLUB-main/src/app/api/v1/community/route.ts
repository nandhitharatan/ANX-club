import { NextResponse } from 'next/server';
import {adminDb} from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let topics: any[] = [];
    try {
      const snapshot = await adminDb.collection('communityTopics').orderBy('createdAt', 'desc').get();
      topics = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (dbErr: any) {
      console.warn(`[GET /api/v1/community] Firestore query fallback: ${dbErr?.message || dbErr}`);
      topics = [];
    }
    
    return NextResponse.json(topics, { status: 200 });
  } catch (error: any) {
    console.warn(`[GET /api/v1/community] Error fetching topics: ${error?.message || error}`);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let authorName = verifiedUser.email?.split('@')[0] || 'Anonymous';
    try {
      const userDoc = await adminDb.collection('users').doc(verifiedUser.uid).get();
      if (userDoc.exists) {
        authorName = userDoc.data()?.fullName || authorName;
      }
    } catch (e) {
      console.error('Error fetching author name:', e);
    }

    const body = await request.json();
    const { title, content, type, tags } = body;
    const authorId = verifiedUser.uid;

    if (!title || !content || !type) {
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

    const docRef = await adminDb.collection('communityTopics').add(topicData);

    return NextResponse.json({ id: docRef.id, ...topicData }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding community topic:', error);
    return NextResponse.json({ error: error.message || 'Failed to add topic' }, { status: 500 });
  }
}

