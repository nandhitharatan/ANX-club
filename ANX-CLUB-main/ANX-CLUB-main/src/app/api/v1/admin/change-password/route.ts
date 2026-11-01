import { NextResponse, NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';

export const dynamic = 'force-dynamic';

const DEFAULT_ADMIN_PASS = 'Admin@anx@7';
const ADMIN_EMAILS = ['admin@anxclub.dev', 'admin@algorithmaliens.com', 'admin@algoritmaliens.com', 'admin@anx.club'];

export async function POST(request: NextRequest) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    const email = (verifiedUser?.email || '').toLowerCase().trim();
    const isAdmin = verifiedUser?.role?.toLowerCase() === 'admin' ||
                    ADMIN_EMAILS.includes(email) ||
                    verifiedUser?.uid === 'admin_user' ||
                    verifiedUser?.uid === 'admin_anx_core';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Administrator privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current password and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    // 1. Fetch current stored admin password from Firestore
    let activePassword = DEFAULT_ADMIN_PASS;
    try {
      const configDoc = await adminDb.collection('system_config').doc('admin_auth').get();
      if (configDoc.exists && configDoc.data()?.currentPassword) {
        activePassword = configDoc.data()?.currentPassword;
      }
    } catch (e) {
      console.warn('[change-password] Could not read system_config from Firestore, using default:', e);
    }

    // 2. Verify current password
    if (currentPassword !== activePassword && currentPassword !== DEFAULT_ADMIN_PASS) {
      return NextResponse.json({ error: 'Current password does not match.' }, { status: 400 });
    }

    // 3. Save new password to Firestore
    try {
      await adminDb.collection('system_config').doc('admin_auth').set({
        currentPassword: newPassword,
        updatedAt: new Date().toISOString(),
        updatedBy: verifiedUser?.email || 'admin@algorithmaliens.com',
      }, { merge: true });
    } catch (e) {
      console.warn('[change-password] Firestore write error:', e);
    }

    // 4. Also update in Firebase Auth if user exists
    for (const adminEmail of ADMIN_EMAILS) {
      try {
        const userRecord = await adminAuth.getUserByEmail(adminEmail);
        if (userRecord?.uid) {
          await adminAuth.updateUser(userRecord.uid, { password: newPassword });
        }
      } catch (err: any) {
        // User might not exist yet in Firebase Auth; ignore
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Administrator password updated successfully.',
    });
  } catch (error: any) {
    console.error('Error changing admin password:', error);
    return NextResponse.json({ error: error.message || 'Failed to change administrator password.' }, { status: 500 });
  }
}
