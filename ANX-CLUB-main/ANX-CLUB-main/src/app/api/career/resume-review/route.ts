import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import { getMemoryReviews, addMemoryReview, updateMemoryReview } from '@/lib/memory-store';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('email')?.toLowerCase();

    let requests: any[] = [];
    try {
      let q: any = adminDb.collection('reviewRequests');
      if (userId) {
        q = q.where('memberId', '==', userId);
      }
      const snapshot = await q.get();
      const firestoreRequests = snapshot.docs.map((doc: any) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
        };
      });

      const memoryReviews = getMemoryReviews();
      const revMap = new Map<string, any>();
      memoryReviews.forEach((r: any) => {
        const matchesUser = !userId || r.memberId === userId || r.userId === userId;
        const matchesEmail = !userEmail || (r.userEmail && r.userEmail.toLowerCase() === userEmail);
        if (matchesUser || matchesEmail) {
          revMap.set(r.id, r);
        }
      });
      firestoreRequests.forEach((r: any) => revMap.set(r.id, r));
      requests = Array.from(revMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (e: any) {
      console.warn('[GET resume-review] Firestore query fallback:', e?.message || e);
      requests = getMemoryReviews()
        .filter((r: any) => (!userId || r.memberId === userId || r.userId === userId) || (!userEmail || (r.userEmail && r.userEmail.toLowerCase() === userEmail)))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    if (requests.length === 0) {
      requests = getMemoryReviews()
        .filter((r: any) => (!userId || r.memberId === userId || r.userId === userId) || (!userEmail || (r.userEmail && r.userEmail.toLowerCase() === userEmail)))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return NextResponse.json({ success: true, data: requests }, { status: 200 });
  } catch (err: any) {
    console.warn('[GET resume-review] Error:', err?.message || err);
    return NextResponse.json({ success: true, data: getMemoryReviews() }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUserId = await authenticate(request);
    const body = await request.json().catch(() => ({}));
    const userId = authUserId || body.userId || 'default_user_123';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to submit a review request' }, { status: 401 });
    }

    const { fileUrl, fileName, targetRole, type, notes, userName, userEmail } = body;

    if (!targetRole || !type) {
      return NextResponse.json({ error: 'Missing targetRole or type' }, { status: 400 });
    }

    if (type !== 'mock' && !fileUrl) {
      return NextResponse.json({ error: 'Missing fileUrl or PDF attachment' }, { status: 400 });
    }

    let reqId = `rev_${Date.now()}`;
    const reqData = {
      id: reqId,
      memberId: userId,
      userName: userName || 'Member',
      userEmail: userEmail || 'user@example.com',
      type, 
      fileUrl: fileUrl || null,
      fileName: fileName || 'Resume.pdf',
      targetRole,
      notes: notes || '',
      status: 'Pending', // Pending, InReview, Completed
      assignedMentorId: null,
      mentorFeedback: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore if available
    try {
      const reqRef = adminDb.collection('reviewRequests').doc();
      reqId = reqRef.id;
      reqData.id = reqId;
      await reqRef.set({
        ...reqData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (saveErr) {
      console.warn('Firestore write for review request fallback to memory store:', saveErr);
    }

    // Always store in memory store for instant admin and user reflection
    addMemoryReview(reqData);

    return NextResponse.json({ 
      success: true, 
      message: 'Review request submitted successfully',
      requestId: reqId,
      data: reqData
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting review request:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    const body = await request.json();
    const { requestId, impact, technicalDepth, presentation, comments, status } = body;
    
    if (!requestId) {
       return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const mentorFeedback = (impact || technicalDepth || presentation || comments) ? {
      impact: impact || 0,
      technicalDepth: technicalDepth || 0,
      presentation: presentation || 0,
      comments: comments || ''
    } : undefined;

    const newStatus = status || 'Completed';

    try {
      await adminDb.collection('reviewRequests').doc(requestId).update({
         ...(mentorFeedback ? { mentorFeedback } : {}),
         assignedMentorId: userId || 'admin',
         status: newStatus,
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (dbErr) {
      console.warn('Firestore update for review request skipped:', dbErr);
    }

    updateMemoryReview(requestId, {
      ...(mentorFeedback ? { mentorFeedback } : {}),
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: 'Review completed successfully' });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
