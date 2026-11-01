import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
import { authenticate } from '@/lib/auth';
import { 
  getMemoryReviews, updateMemoryReview,
  getMemoryBookings, updateMemoryBooking,
  getMemoryProposals, updateMemoryProposal
} from '@/lib/memory-store';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    const email = (verifiedUser?.email || "").toLowerCase().trim();
    const isAdmin = verifiedUser?.role?.toLowerCase() === "admin" ||
                    email === "admin@anxclub.dev" ||
                    email === "admin@algorithmaliens.com" ||
                    email === "admin@anx.club" ||
                    email === "admin@algoritmaliens.com" ||
                    verifiedUser?.uid === "admin_user" ||
                    verifiedUser?.uid === "admin_anx_core";
        if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Administrator privileges required' }, { status: 403 });
    }

    // 1. Fetch Resume Reviews
    let resumeReviews: any[] = [];
    try {
      const reviewsSnap = await adminDb.collection('reviewRequests').get();
      const firestoreReviews: any[] = [];
      reviewsSnap.forEach(doc => {
        const data = doc.data();
        firestoreReviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
        });
      });

      const memReviews = getMemoryReviews();
      const revMap = new Map<string, any>();
      memReviews.forEach(r => revMap.set(r.id, r));
      firestoreReviews.forEach(r => revMap.set(r.id, r));
      resumeReviews = Array.from(revMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (e: any) {
      console.warn('[Admin Submissions] reviewRequests fallback to memory store:', e?.message || e);
      resumeReviews = [...getMemoryReviews()].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    if (resumeReviews.length === 0) {
      resumeReviews = [...getMemoryReviews()];
    }

    // 2. Fetch Mentor Bookings
    let mentorBookings: any[] = [];
    try {
      const mentorSnap = await adminDb.collection('mentorRequests').get();
      const firestoreBookings: any[] = [];
      mentorSnap.forEach(doc => {
        const data = doc.data();
        firestoreBookings.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
        });
      });

      const memBookings = getMemoryBookings();
      const bookMap = new Map<string, any>();
      memBookings.forEach(b => bookMap.set(b.id, b));
      firestoreBookings.forEach(b => bookMap.set(b.id, b));
      mentorBookings = Array.from(bookMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (e: any) {
      console.warn('[Admin Submissions] mentorRequests fallback to memory store:', e?.message || e);
      mentorBookings = [...getMemoryBookings()].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    if (mentorBookings.length === 0) {
      mentorBookings = [...getMemoryBookings()];
    }

    // 3. Fetch Incubator Proposals
    let incubatorProposals: any[] = [];
    try {
      const ideasSnap = await adminDb.collection('ideas').get();
      const firestoreProposals: any[] = [];
      ideasSnap.forEach(doc => {
        const data = doc.data();
        firestoreProposals.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
        });
      });

      const memProposals = getMemoryProposals();
      const propMap = new Map<string, any>();
      memProposals.forEach(p => propMap.set(p.id, p));
      firestoreProposals.forEach(p => propMap.set(p.id, p));
      incubatorProposals = Array.from(propMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (e: any) {
      console.warn('[Admin Submissions] ideas fallback to memory store:', e?.message || e);
      incubatorProposals = [...getMemoryProposals()].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    if (incubatorProposals.length === 0) {
      incubatorProposals = [...getMemoryProposals()];
    }

    return NextResponse.json({
      success: true,
      data: {
        resumeReviews,
        mentorBookings,
        incubatorProposals,
        summary: {
          totalResumes: resumeReviews.length,
          pendingResumes: resumeReviews.filter(r => r.status === 'Pending').length,
          totalMentorBookings: mentorBookings.length,
          pendingBookings: mentorBookings.filter(b => b.status === 'Pending').length,
          totalProposals: incubatorProposals.length,
          underReviewProposals: incubatorProposals.filter(p => p.status === 'Under Review' || p.status === 'Submitted' || p.status === 'Idea').length,
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.warn('[Admin Submissions] Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    const email = (verifiedUser?.email || "").toLowerCase().trim();
    const isAdmin = verifiedUser?.role?.toLowerCase() === "admin" ||
                    email === "admin@anxclub.dev" ||
                    email === "admin@algorithmaliens.com" ||
                    email === "admin@anx.club" ||
                    email === "admin@algoritmaliens.com" ||
                    verifiedUser?.uid === "admin_user" ||
                    verifiedUser?.uid === "admin_anx_core";
        if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Administrator privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionType, id, status, feedback, meetingLink } = body;

    if (!submissionType || !id || !status) {
      return NextResponse.json({ error: 'Missing submissionType, id, or status' }, { status: 400 });
    }

    if (submissionType === 'resume') {
      try {
        await adminDb.collection('reviewRequests').doc(id).update({
          status,
          ...(feedback ? { mentorFeedback: feedback } : {}),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e: any) {
        console.warn(`[PATCH resume review] Firestore update notice: ${e?.message || e}`);
      }
      updateMemoryReview(id, {
        status,
        ...(feedback ? { mentorFeedback: feedback } : {}),
        updatedAt: new Date().toISOString()
      });
    } else if (submissionType === 'mentor') {
      try {
        await adminDb.collection('mentorRequests').doc(id).update({
          status,
          ...(meetingLink ? { meetingLink } : {}),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e: any) {
        console.warn(`[PATCH mentor booking] Firestore update notice: ${e?.message || e}`);
      }
      updateMemoryBooking(id, {
        status,
        ...(meetingLink ? { meetingLink } : {}),
        updatedAt: new Date().toISOString()
      });
    } else if (submissionType === 'incubator') {
      try {
        await adminDb.collection('ideas').doc(id).update({
          status,
          ...(feedback ? { adminFeedback: feedback } : {}),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e: any) {
        console.warn(`[PATCH incubator proposal] Firestore update notice: ${e?.message || e}`);
      }
      updateMemoryProposal(id, {
        status,
        ...(feedback ? { adminFeedback: feedback } : {}),
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Submission ${id} status updated to ${status}` 
    }, { status: 200 });

  } catch (error: any) {
    console.warn('[Admin Submissions PATCH] Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
