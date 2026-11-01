import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ideaId, name, members = [] } = body;

    if (!ideaId || !name) {
      return NextResponse.json({ error: 'Missing ideaId or team name' }, { status: 400 });
    }

    const teamRef = adminDb.collection('ideaTeams').doc();
    const teamData = {
      id: teamRef.id,
      ideaId,
      name,
      members: Array.from(new Set([userId, ...members])), // Ensure creator is in team
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    await teamRef.set(teamData);

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      teamId: teamRef.id
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ success: false, message: 'Failed to create team' }, { status: 500 });
  }
}
