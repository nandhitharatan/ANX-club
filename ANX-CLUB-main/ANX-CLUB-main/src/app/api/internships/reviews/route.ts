import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const userId = await authenticate(request as any);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData || (userData.role !== 'Admin' && userData.role !== 'Mentor')) {
      return NextResponse.json({ error: 'Forbidden: Mentor access required' }, { status: 403 });
    }

    const body = await request.json();
    const { internId, weekNumber, impact, technicalDepth, presentation, summary, notes, isFinal, internshipTitle } = body;

    const reviewRef = adminDb.collection('internshipReviews').doc();
    const averageScore = (parseInt(impact, 10) + parseInt(technicalDepth, 10) + parseInt(presentation, 10)) / 3;
    
    await reviewRef.set({
      id: reviewRef.id,
      internId,
      reviewerId: userId,
      weekNumber: parseInt(weekNumber, 10),
      rubricScores: {
        impact: parseInt(impact, 10),
        technicalDepth: parseInt(technicalDepth, 10),
        presentation: parseInt(presentation, 10),
      },
      averageScore,
      deliverablesSummary: summary || '',
      mentorNotes: notes || '',
      isFinal: Boolean(isFinal),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    let certificateIssued = false;
    // If this is the final review or completed status with passing score, auto-issue certificate
    if (isFinal && averageScore >= 2.5) {
      try {
        const internDoc = await adminDb.collection('users').doc(internId).get();
        const internName = internDoc.exists ? (internDoc.data()?.fullName || internDoc.data()?.email) : 'Intern';
        
        const origin = new URL(request.url).origin;
        const certRes = await fetch(`${origin}/api/certificates/issue`, {
          method: 'POST',
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            memberId: internId,
            recipientName: internName,
            title: `Internship Completion: ${internshipTitle || 'Software Engineering Internship'}`,
            templateType: 'internship_completion'
          })
        });
        if (certRes.ok) certificateIssued = true;
      } catch (certErr) {
        console.warn('Internship certificate auto-issue failed:', certErr);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Internship review submitted successfully',
      certificateIssued
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit review', error: error.message }, { status: 500 });
  }
}
