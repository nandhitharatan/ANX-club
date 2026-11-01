import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import * as admin from 'firebase-admin';
import { awardXP } from '@/lib/gamification';
import { sendXPUnlockAlert } from '@/lib/notifications';
import { addMemoryProposal } from '@/lib/memory-store';
import { z } from 'zod';

const IdeaSubmitSchema = z.object({
  title: z.string().min(3).max(120),
  problemStatement: z.string().min(10).max(2000),
  proposedSolution: z.string().min(10).max(3000),
  targetUsers: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  proposalPdf: z.string().optional(),
  pdfFileName: z.string().optional(),
  pdfUrl: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { getMemoryProposals } = await import('@/lib/memory-store');
    let ideasList: any[] = [];
    try {
      const snapshot = await adminDb.collection('ideas').get();
      const firestoreIdeas: any[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        firestoreIdeas.push({
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
        });
      });

      const memIdeas = getMemoryProposals();
      const map = new Map<string, any>();
      memIdeas.forEach((i: any) => map.set(i.id, i));
      firestoreIdeas.forEach((i: any) => map.set(i.id, i));
      ideasList = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (e: any) {
      console.warn('[GET /api/incubation/submit] Firestore query fallback:', e?.message || e);
      ideasList = [...getMemoryProposals()].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    if (ideasList.length === 0) {
      ideasList = [...getMemoryProposals()];
    }

    return NextResponse.json({ success: true, data: ideasList }, { status: 200 });
  } catch (err: any) {
    const { getMemoryProposals } = await import('@/lib/memory-store');
    return NextResponse.json({ success: true, data: getMemoryProposals() }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = IdeaSubmitSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.format() }, { status: 400 });
    }

    const { 
      title, 
      problemStatement, 
      proposedSolution, 
      targetUsers, 
      techStack,
      proposalPdf,
      pdfFileName,
      pdfUrl
    } = parseResult.data;

    // Create Idea Document
    let ideaId = `idea_${Date.now()}`;
    const ideaData = {
      id: ideaId,
      title,
      problemStatement,
      proposedSolution,
      targetUsers: targetUsers || '',
      techStack: techStack || [],
      proposalPdf: proposalPdf || pdfUrl || null,
      pdfFileName: pdfFileName || (proposalPdf ? 'Proposal.pdf' : null),
      pdfUrl: pdfUrl || (proposalPdf ? proposalPdf : null),
      submitterId: userId,
      status: 'Under Review', // Under Review / Idea
      mentorFeedback: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const ideaRef = adminDb.collection('ideas').doc();
      ideaId = ideaRef.id;
      ideaData.id = ideaId;
      await ideaRef.set({
        ...ideaData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (saveErr) {
      console.warn('Firestore write for idea fallback to memory store:', saveErr);
    }

    // Always record in memory store for instant admin submissions reflection
    addMemoryProposal(ideaData);

    // Award XP for Submission (+30 XP per PRD)
    let xpAwarded = 30;
    try {
      const xpResult = await awardXP(userId, 'idea', 30, ideaId, `Product Idea: ${title}`);
      xpAwarded = xpResult.xpAwarded;
    } catch (xpErr) {
      console.warn('XP award error for idea submission:', xpErr);
    }
    
    // Notify user about XP
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData && xpAwarded > 0) {
        await sendXPUnlockAlert(userId, xpAwarded, userData.email, userData.phoneNumber);
      }
    } catch (notifErr) {
      console.warn('XP alert notification skipped:', notifErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product Idea & Proposal submitted successfully! +30 XP awarded.',
      ideaId: ideaId,
      xpAwarded
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting idea:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
