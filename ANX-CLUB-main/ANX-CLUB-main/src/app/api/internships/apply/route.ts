import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { awardXP } from '@/lib/gamification';
import { sendXPUnlockAlert } from '@/lib/notifications';

function calculateSkillMatch(userSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!userSkills || userSkills.length === 0) return 0;
  
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  let matches = 0;
  
  for (const skill of requiredSkills) {
    if (userSkillsLower.includes(skill.toLowerCase())) {
      matches++;
    }
  }
  
  return Math.round((matches / requiredSkills.length) * 100);
}

export async function POST(request: Request) {
  try {
    const { authenticate } = await import('@/lib/auth');
    const userId = await authenticate(request as any);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { internshipId } = body;

    if (!internshipId) {
      return NextResponse.json({ error: 'Missing internshipId' }, { status: 400 });
    }

    // 1. Fetch User Data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userDoc.data()!;

    // 2. Fetch Internship Data
    const internshipDoc = await adminDb.collection('internships').doc(internshipId).get();
    if (!internshipDoc.exists) {
      return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }
    const internshipData = internshipDoc.data()!;

    // 3. Calculate Rule-Based Skill Match Indicator
    const matchScore = calculateSkillMatch(userData.skills || [], internshipData.requiredSkills || []);

    // 4. Create Application Record
    const appRef = adminDb.collection('internshipApplications').doc();
    const appData = {
      id: appRef.id,
      internshipId,
      memberId: userId,
      memberDetails: {
        name: userData.fullName || 'Anonymous',
        email: userData.email,
        phone: userData.phoneNumber || '',
        skills: userData.skills || []
      },
      status: 'Applied', // Applied, Interviewing, Accepted, Rejected
      skillMatchScore: matchScore,
      appliedDate: admin.firestore.FieldValue.serverTimestamp(),
    };

    await appRef.set(appData);

    // 5. Award XP
    const { xpAwarded } = await awardXP(userId, 'internship', 10, appRef.id, 'Internship Application Submitted');
    await sendXPUnlockAlert(userId, xpAwarded, userData.email, userData.phoneNumber);

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully',
      applicationId: appRef.id,
      skillMatchScore: matchScore
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
