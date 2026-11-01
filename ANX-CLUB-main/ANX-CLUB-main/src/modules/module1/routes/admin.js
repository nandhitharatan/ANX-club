// server/routes/admin.js
// Admin-only routes: list all users, change user roles

import express from 'express';
import { auth, db } from '../config/firebase.js';
import { verifyToken, requireAdmin } from '../middleware/verifyToken.js';

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(verifyToken, requireAdmin);

// ─────────────────────────────────────────────
// GET /api/admin/users
// Returns a list of all user profiles from Firestore.
// Supports optional pagination via ?limit=20&startAfter=<lastUid>
// ─────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const startAfter = req.query.startAfter;

  try {
    let query = db.collection('users').orderBy('joinedDate', 'desc').limit(limit);

    if (startAfter) {
      const lastDoc = await db.collection('users').doc(startAfter).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map((doc) => doc.data());

    return res.status(200).json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error('[GET /admin/users]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/users/:uid
// Returns a single user's profile by UID.
// ─────────────────────────────────────────────
router.get('/users/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const userSnap = await db.collection('users').doc(uid).get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: `User with uid '${uid}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      profile: userSnap.data(),
    });
  } catch (error) {
    console.error('[GET /admin/users/:uid]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:uid/role
// Changes a user's role. Allowed roles: Visitor, Member, Admin.
// Body: { role: 'Member' }
// ─────────────────────────────────────────────
router.patch('/users/:uid/role', async (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;

  const ALLOWED_ROLES = ['Visitor', 'Member', 'Admin'];

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Allowed values: ${ALLOWED_ROLES.join(', ')}.`,
    });
  }

  try {
    // 1. Update Firestore profile
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: `User with uid '${uid}' not found.`,
      });
    }

    await userRef.update({ role, updatedAt: new Date().toISOString() });

    // 2. Update Firebase Auth custom claims so token reflects new role
    await auth.setCustomUserClaims(uid, { role });

    // 3. Revoke existing tokens so the new role is enforced immediately
    await auth.revokeRefreshTokens(uid);

    return res.status(200).json({
      success: true,
      message: `User role updated to '${role}'.`,
    });
  } catch (error) {
    console.error('[PATCH /admin/users/:uid/role]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/users/:uid
// Deletes a user from Firebase Auth and removes their Firestore profile.
// Admin cannot delete themselves.
// ─────────────────────────────────────────────
router.delete('/users/:uid', async (req, res) => {
  const { uid } = req.params;
  const adminUid = req.user.uid;

  if (uid === adminUid) {
    return res.status(400).json({
      success: false,
      message: 'Admins cannot delete their own account.',
    });
  }

  try {
    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();

    return res.status(200).json({
      success: true,
      message: `User '${uid}' deleted successfully.`,
    });
  } catch (error) {
    console.error('[DELETE /admin/users/:uid]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
