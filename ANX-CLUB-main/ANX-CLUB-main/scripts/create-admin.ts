import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// 1. Ensure environment variables from .env are loaded before initializing Firebase Admin
function loadEnvFile() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../.env.local'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val.replace(/\\n/g, '\n');
            }
          }
        }
      } catch (err) {
        console.warn(`Warning: Could not parse ${envPath}:`, err);
      }
    }
  }
}

loadEnvFile();

// Import adminAuth and adminDb after env variables are populated
import { adminAuth, adminDb, logFirestoreFallback } from '../src/lib/firebase/admin';

// Configuration
const targetEmail = (process.env.ADMIN_EMAIL || 'admin@anxclub.dev').trim().toLowerCase();
const fullName = (process.env.ADMIN_NAME || 'ANX System Administrator').trim();

/**
 * Generates a cryptographically strong temporary password.
 * Guaranteed to contain uppercase, lowercase, numbers, and symbols.
 */
function generateSecurePassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*-_+=';
  const all = upper + lower + digits + symbols;

  let pwd = '';
  pwd += upper[crypto.randomInt(upper.length)];
  pwd += lower[crypto.randomInt(lower.length)];
  pwd += digits[crypto.randomInt(digits.length)];
  pwd += symbols[crypto.randomInt(symbols.length)];

  for (let i = pwd.length; i < length; i++) {
    pwd += all[crypto.randomInt(all.length)];
  }

  // Shuffle characters to avoid predictable patterns
  return pwd.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

async function setupAdminAccount() {
  console.log('====================================================');
  console.log('  ANX CLUB — Development Admin Account Setup');
  console.log('====================================================\n');

  // Verify Firebase Admin SDK Credentials
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Error: Missing required Firebase Admin SDK credentials in environment.');
    console.error('   Please ensure the following environment variables are configured in .env:');
    console.error('   - FIREBASE_PROJECT_ID');
    console.error('   - FIREBASE_CLIENT_EMAIL');
    console.error('   - FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  console.log(` Target Admin Email : ${targetEmail}`);
  console.log(` Project ID         : ${projectId}`);

  // Generate strong temporary password or use explicit CLI/env override
  const temporaryPassword = process.env.ADMIN_PASSWORD || generateSecurePassword(16);

  let user: any = null;
  let isExisting = false;

  try {
    user = await adminAuth.getUserByEmail(targetEmail);
    isExisting = true;
    console.log(`ℹ️  Existing account found for ${targetEmail} (UID: ${user.uid}). Updating credentials...`);
    user = await adminAuth.updateUser(user.uid, {
      password: temporaryPassword,
      displayName: fullName,
      emailVerified: true,
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(` Creating new Firebase Authentication user for ${targetEmail}...`);
      user = await adminAuth.createUser({
        email: targetEmail,
        password: temporaryPassword,
        displayName: fullName,
        emailVerified: true,
      });
      console.log(` Firebase Auth user created successfully (UID: ${user.uid}).`);
    } else {
      throw error;
    }
  }

  // Set Custom Claims for cryptographic Admin verification
  console.log(' Assigning Admin Custom User Claims in Firebase Auth...');
  await adminAuth.setCustomUserClaims(user.uid, {
    role: 'Admin',
    admin: true,
  });
  console.log(' Custom Claims set: { role: "Admin", admin: true }');

  // Sync with Firestore user document
  console.log(' Syncing user profile in Firestore collection "users"...');
  let firestoreStatus = 'Synced';
  try {
    await adminDb.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: targetEmail,
      fullName,
      role: 'Admin',
      membershipType: 'premium',
      updatedAt: new Date(),
    }, { merge: true });
    console.log(` Firestore user document (users/${user.uid}) updated with role: 'Admin'.`);
  } catch (dbErr: any) {
    firestoreStatus = 'Firestore Unavailable (Code: ' + (dbErr?.code || 'UNKNOWN') + ')';
    logFirestoreFallback('Admin Creation', dbErr);
    console.warn(`⚠️  Firestore Notice: Remote database write did not complete (${dbErr?.message || dbErr}).`);
    console.warn('   The Admin account is still fully functional via Firebase Auth Custom Claims.');
  }

  console.log('\n====================================================');
  console.log('✅ Development Admin Account Configured Successfully!');
  console.log('====================================================');
  console.log(`Email            : ${targetEmail}`);
  console.log(`Role             : Admin`);
  console.log(`UID              : ${user.uid}`);
  console.log(`Temporary Password: ${temporaryPassword}`);
  console.log(`Account Status   : ${isExisting ? 'Password Reset / Updated' : 'Created'}`);
  console.log(`Firestore Status : ${firestoreStatus}`);
  console.log('----------------------------------------------------');
  console.log('⚠️  SECURITY NOTICE: Store this temporary password in a secure');
  console.log('   password manager. It will not be shown again.');
  console.log('====================================================\n');
}

setupAdminAccount().catch((err) => {
  console.error('\n❌ Admin setup failed:', err?.message || err);
  process.exitCode = 1;
});
