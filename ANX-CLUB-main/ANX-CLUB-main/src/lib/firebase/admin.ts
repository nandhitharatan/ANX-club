import * as admin from 'firebase-admin';

class FirebaseAdminSingleton {
  private static instance: admin.app.App | null = null;
  private static dbInstance: admin.firestore.Firestore | null = null;
  private static authInstance: admin.auth.Auth | null = null;
  private static storageInstance: admin.storage.Storage | null = null;

  private constructor() {}

  public static getApp(): admin.app.App {
    if (this.instance) return this.instance;

    if (admin.apps.length > 0) {
      this.instance = admin.apps[0]!;
      return this.instance;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin SDK missing required credentials.");
    }

    try {
      this.instance = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      return this.instance;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  public static get db(): admin.firestore.Firestore {
    if (!this.dbInstance) this.dbInstance = this.getApp().firestore();
    return this.dbInstance;
  }

  public static get auth(): admin.auth.Auth {
    if (!this.authInstance) this.authInstance = this.getApp().auth();
    return this.authInstance;
  }

  public static get storage(): admin.storage.Storage {
    if (!this.storageInstance) this.storageInstance = this.getApp().storage();
    return this.storageInstance;
  }
}

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_, prop) {
    const db = FirebaseAdminSingleton.db;
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_, prop) {
    const auth = FirebaseAdminSingleton.auth;
    const value = (auth as any)[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  }
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_, prop) {
    const storage = FirebaseAdminSingleton.storage;
    const value = (storage as any)[prop];
    return typeof value === 'function' ? value.bind(storage) : value;
  }
});

export function logFirestoreFallback(service: string, error: unknown): void {
  const firestoreError = error as { code?: number | string };
  if (firestoreError.code === 5 || firestoreError.code === '5') {
    console.warn(`${service}: Firestore database unavailable; using mock fallback.`);
    return;
  }

  console.warn(`${service}: Firestore request failed; using mock fallback.`, error);
}
