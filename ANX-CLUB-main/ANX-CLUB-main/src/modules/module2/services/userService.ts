import {adminDb, logFirestoreFallback} from '@/lib/firebase/admin';
const db = adminDb;
import { UserProfile } from '@/modules/module2/types/dashboard';
import { getUserByIdOrEmail } from '@/modules/module2/data';

export async function getUser(
  userId: string,
  mock = false,
  fail = false
): Promise<UserProfile | Record<string, never>> {
  if (fail) {
    throw new Error('Simulated failure in User Service');
  }

  if (db && !mock) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        const data = doc.data();
        return data ? (data as UserProfile) : {};
      }
    } catch (error) {
      logFirestoreFallback('User service', error);
    }
  }

  // Fallback / Mock data from Data Layer
  const record = getUserByIdOrEmail(userId);
  if (record) {
    return {
      ...record.user,
      overallProgress: record.overallProgress,
      programProgress: record.programProgress,
    };
  }

  return {};
}
