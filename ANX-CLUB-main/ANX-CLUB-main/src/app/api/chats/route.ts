import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentEmail, currentUserName, targetEmail, targetUserName } = body;

    if (!currentEmail || !targetEmail || !currentUserName || !targetUserName) {
      return NextResponse.json({ error: 'Missing required fields or mentor has no owner email' }, { status: 400 });
    }

    // Sort emails to ensure consistent participant array query
    const participants = [currentEmail, targetEmail].sort();

    // Check if chat exists
    const q = db.collection('chats').where('participants', '==', participants);
    const snapshot = await q.get();

    if (!snapshot.empty) {
      // Chat exists, return existing ID
      const existingChatId = snapshot.docs[0].id;
      return NextResponse.json({ chatId: existingChatId });
    }

    // Create new chat
    const chatData = {
      participants,
      participantNames: {
        [currentEmail]: currentUserName,
        [targetEmail]: targetUserName
      },
      updatedAt: new Date().toISOString(),
      lastMessage: ""
    };

    const docRef = await db.collection('chats').add(chatData);

    return NextResponse.json({ chatId: docRef.id });

  } catch (error: any) {
    console.error('Error in chats API:', error);
    return NextResponse.json({ error: 'Failed to initialize chat' }, { status: 500 });
  }
}
