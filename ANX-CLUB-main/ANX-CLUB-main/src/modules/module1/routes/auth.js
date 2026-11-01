// server/routes/auth.js
// Authentication routes: signup, login verification, Google sign-in sync

import express from 'express';
import { auth, db } from '../config/firebase.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/auth/signup
// Creates a new Firebase Auth user and saves their profile to Firestore.
// Body: { email, password, fullName }
// ─────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      message: 'email, password, and fullName are required.',
    });
  }

  try {
    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // 2. Set default role via custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: 'Visitor' });

    // 3. Save user profile document to Firestore
    const profileData = {
      uid: userRecord.uid,
      email: userRecord.email,
      fullName: fullName,
      role: 'Visitor',
      joinedDate: new Date().toISOString(),
      phoneNumber: '',
      collegeName: '',
      yearBranch: '',
      skills: '',
      interests: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(profileData);

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error('[POST /auth/signup]', error.message);

    // Map Firebase error codes to friendly messages
    const errorMessages = {
      'auth/email-already-exists': 'This email is already registered.',
      'auth/invalid-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'The email address is not valid.',
    };

    return res.status(400).json({
      success: false,
      message: errorMessages[error.code] || error.message,
    });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/google-sync
// Called after a successful Google sign-in on the frontend.
// Creates a Firestore profile for new Google users if one doesn't exist.
// Requires a valid Firebase ID token in the Authorization header.
// ─────────────────────────────────────────────
router.post('/google-sync', verifyToken, async (req, res) => {
  const { uid, email, name } = req.user;

  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // New Google user — create their profile
      const profileData = {
        uid,
        email,
        fullName: name || 'Google User',
        role: 'Visitor',
        joinedDate: new Date().toISOString(),
        phoneNumber: '',
        collegeName: '',
        yearBranch: '',
        skills: '',
        interests: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        createdAt: new Date().toISOString(),
      };
      await userRef.set(profileData);
      await auth.setCustomUserClaims(uid, { role: 'Visitor' });

      return res.status(201).json({
        success: true,
        message: 'Google user profile created.',
        profile: profileData,
      });
    }

    // Existing user — return their profile
    return res.status(200).json({
      success: true,
      message: 'Google user already exists.',
      profile: userSnap.data(),
    });
  } catch (error) {
    console.error('[POST /auth/google-sync]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/verify-token
// Verifies a client-side Firebase ID token and returns decoded user info.
// Useful for SSR or server-side session setup.
// ─────────────────────────────────────────────
router.post('/verify-token', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
