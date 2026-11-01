import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const doc = await adminDb.collection('roadmaps').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userEmail = (userData?.email || '').toLowerCase();
    const isAdmin = userData?.role?.toLowerCase() === 'admin' || 
                    userEmail === 'admin@algorithmaliens.com' || 
                    userEmail === 'admin@anx.club' ||
                    userId.includes('admin');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = params;
    await adminDb.collection('roadmaps').doc(id).delete();
    return NextResponse.json({ success: true, message: 'Roadmap deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
