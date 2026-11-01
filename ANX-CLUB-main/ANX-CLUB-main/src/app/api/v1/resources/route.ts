import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import { getMemoryResources, addMemoryResource } from '@/lib/memory-store';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let resources: any[] = [];
    try {
      const snapshot = await adminDb.collection('resources').get();
      if (!snapshot.empty) {
        const firestoreRes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const memRes = getMemoryResources();
        const resMap = new Map<string, any>();
        memRes.forEach(r => resMap.set(r.id, r));
        firestoreRes.forEach(r => resMap.set(r.id, r));
        resources = Array.from(resMap.values());
      } else {
        resources = getMemoryResources();
      }
    } catch (dbErr: any) {
      console.warn(`[GET /api/v1/resources] Firestore fallback to memory resources: ${dbErr?.message || dbErr}`);
      resources = getMemoryResources();
    }

    if (resources.length === 0) {
      resources = getMemoryResources();
    }

    return NextResponse.json(resources, { status: 200 });
  } catch (error: any) {
    console.warn('Error fetching resources:', error?.message || error);
    return NextResponse.json(getMemoryResources(), { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    const body = await request.json();
    const { title, type, category, duration, level, url, isPremium, thumbnail } = body;

    if (!title || !category) {
      return NextResponse.json({ error: 'Missing title or category' }, { status: 400 });
    }

    const resId = `res_${Date.now()}`;
    const resourceData = {
      id: resId,
      title,
      type: type || 'document',
      category,
      duration: duration || '1h',
      level: level || 'Intermediate',
      url: url || '#',
      isPremium: Boolean(isPremium),
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
      createdBy: userId || 'admin',
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = adminDb.collection('resources').doc(resId);
      await docRef.set({
        ...resourceData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (saveErr) {
      console.warn('Firestore write for resource fallback to memory store:', saveErr);
    }

    addMemoryResource(resourceData);

    return NextResponse.json({ success: true, data: resourceData }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
