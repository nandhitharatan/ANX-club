// server/middleware/verifyToken.js
// Middleware to verify Firebase ID tokens on protected routes

import { auth } from '../config/firebase.js';

/**
 * Verifies the Firebase Bearer token from the Authorization header.
 * Attaches decoded token data to req.user on success.
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken; // { uid, email, name, ... }
    next();
  } catch (error) {
    console.error('[verifyToken] Token verification failed:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or expired token.',
    });
  }
};

/**
 * Additional middleware to check if the authenticated user has the 'Admin' role.
 * Must be used AFTER verifyToken.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const userRecord = await auth.getUser(uid);
    const role = userRecord.customClaims?.role;

    if (role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required.',
      });
    }
    next();
  } catch (error) {
    console.error('[requireAdmin] Failed to verify admin role:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
