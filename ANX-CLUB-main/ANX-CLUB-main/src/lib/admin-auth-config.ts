import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const STANDARD_ADMIN_EMAIL = 'admin@anxclub.dev';
export const DEFAULT_ADMIN_PASSWORD = 'Admin@anx@7';

export const OFFICIAL_ADMIN_EMAILS = [
  'admin@anxclub.dev',
  'admin@algorithmaliens.com',
  'admin@algoritmaliens.com',
  'admin@anx.club'
];

export function isOfficialAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return OFFICIAL_ADMIN_EMAILS.includes(clean) || clean.startsWith('admin@');
}

export function normalizeAdminEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  if (clean === 'admin@algorithmaliens' || clean === 'admin@algoritmaliens' || clean === 'admin@anx') {
    return 'admin@anxclub.dev';
  }
  if (clean === 'admin@algoritmaliens.com') {
    return 'admin@algorithmaliens.com';
  }
  return clean;
}

export async function getActiveAdminPassword(): Promise<string> {
  // 1. Try local storage cache
  let localPass: string | null = null;
  if (typeof window !== 'undefined') {
    localPass = localStorage.getItem('anx_admin_password');
  }

  if (localPass) return localPass;

  // 2. Try Firestore with a 1.5s timeout so it never hangs
  try {
    const fetchDoc = getDoc(doc(db, 'system_config', 'admin_auth'));
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    const snap: any = await Promise.race([fetchDoc, timeout]);

    if (snap && snap.exists && snap.data()?.currentPassword) {
      const remotePass = snap.data()?.currentPassword;
      if (typeof window !== 'undefined') {
        localStorage.setItem('anx_admin_password', remotePass);
      }
      return remotePass;
    }
  } catch (err) {
    console.warn('[getActiveAdminPassword] Firestore fallback:', err);
  }

  return localPass || DEFAULT_ADMIN_PASSWORD;
}

export async function verifyAdminPasswordLocally(enteredPassword: string): Promise<boolean> {
  // Instant check against default password
  if (enteredPassword === DEFAULT_ADMIN_PASSWORD) {
    return true;
  }

  // Instant check against local storage cached password
  if (typeof window !== 'undefined') {
    const localPass = localStorage.getItem('anx_admin_password');
    if (localPass && enteredPassword === localPass) {
      return true;
    }
  }

  // Check remote active password
  const activePass = await getActiveAdminPassword();
  return enteredPassword === activePass || enteredPassword === DEFAULT_ADMIN_PASSWORD;
}

export async function updateAdminPasswordInFirestore(newPassword: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('anx_admin_password', newPassword);
  }
  try {
    setDoc(doc(db, 'system_config', 'admin_auth'), {
      currentPassword: newPassword,
      updatedAt: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn('[updateAdminPasswordInFirestore] Firestore write error:', err);
  }
}
