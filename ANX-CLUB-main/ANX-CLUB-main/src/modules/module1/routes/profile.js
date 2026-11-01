// server/routes/profile.js
// User profile routes: get own profile, update profile

import express from 'express';
import { db } from '../config/firebase.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// All profile routes require authentication
router.use(verifyToken);

// ─────────────────────────────────────────────
// GET /api/profile
// Returns the authenticated user's own profile from Firestore.
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { uid } = req.user;

  try {
    const userSnap = await db.collection('users').doc(uid).get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      profile: userSnap.data(),
    });
  } catch (error) {
    console.error('[GET /profile]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/profile
// Updates the authenticated user's profile in Firestore.
// Body: Partial profile fields (only updatable fields are allowed).
// ─────────────────────────────────────────────
router.put('/', async (req, res) => {
  const { uid } = req.user;

  // Whitelist of fields the user is allowed to update
  const ALLOWED_FIELDS = [
    'fullName',
    'phoneNumber',
    'collegeName',
    'yearBranch',
    'skills',
    'interests',
    'linkedinUrl',
    'githubUrl',
    'portfolioUrl',
  ];

  // Filter out any disallowed fields (e.g., uid, role, email)
  const updates = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update.',
    });
  }

  updates.updatedAt = new Date().toISOString();

  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    await userRef.update(updates);

    const updatedSnap = await userRef.get();
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updatedSnap.data(),
    });
  } catch (error) {
    console.error('[PUT /profile]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
