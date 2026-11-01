import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, company, bio, linkedin, topics, imageUrl, ownerEmail } = body;

    if (!name || !role || !company || !topics || topics.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mentorData = {
      name,
      role,
      company,
      bio: bio || '',
      linkedin: linkedin || '',
      topics,
      imageUrl: imageUrl || '',
      ownerEmail: ownerEmail || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('mentors').add(mentorData);

    return NextResponse.json({ id: docRef.id, ...mentorData }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mentor:', error);
    return NextResponse.json({ error: error.message || 'Error creating mentor' }, { status: 500 });
  }
}

