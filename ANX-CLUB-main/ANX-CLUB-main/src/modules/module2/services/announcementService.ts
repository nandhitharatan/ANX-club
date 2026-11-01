import {adminDb, logFirestoreFallback} from '@/lib/firebase/admin';
const db = adminDb;
import { Announcement } from '@/modules/module2/types/dashboard';
import { getAnnouncementsByUserId } from '@/modules/module2/data';
import * as admin from 'firebase-admin';

export async function getAnnouncements(
  userId?: string,
  mock = false,
  fail = false
): Promise<Announcement[]> {
  if (fail) {
    throw new Error('Simulated failure in Announcement Service');
  }

  if (db && !mock) {
    try {
      const announcements: Announcement[] = [];
      const seenIds = new Set<string>();

      let userSnapPromise = Promise.resolve() as Promise<unknown>;
      if (userId) {
        userSnapPromise = db.collection('announcements')
          .where('userId', '==', userId)
          .orderBy('publishedAt', 'desc')
          .limit(5)
          .get();
      }

      const globalSnapPromise = db.collection('announcements')
        .orderBy('publishedAt', 'desc')
        .limit(5)
        .get();

      const [userSnapRaw, globalSnapRaw] = await Promise.all([
        userSnapPromise,
        globalSnapPromise
      ]);

      const userSnap = userSnapRaw as admin.firestore.QuerySnapshot | undefined;
      const globalSnap = globalSnapRaw as admin.firestore.QuerySnapshot;

      if (userSnap && !userSnap.empty) {
        userSnap.forEach(doc => {
          const data = doc.data();
          announcements.push({
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            publishedAt: data.publishedAt || '',
            priority: data.priority || 'medium',
          });
          seenIds.add(doc.id);
        });
      }

      if (globalSnap && !globalSnap.empty) {
        globalSnap.forEach(doc => {
          if (!seenIds.has(doc.id)) {
            const data = doc.data();
            // Only include if it is a global announcement (no userId) or is targeted to this user
            if (!data.userId || (userId && data.userId === userId)) {
              announcements.push({
                id: doc.id,
                title: data.title || '',
                content: data.content || '',
                publishedAt: data.publishedAt || '',
                priority: data.priority || 'medium',
              });
              seenIds.add(doc.id);
            }
          }
        });
      }

      return announcements
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 5);
    } catch (error) {
      logFirestoreFallback('Announcements service', error);
    }
  }

  // Fallback / Mock data from Data Layer
  if (userId) {
    return getAnnouncementsByUserId(userId);
  }

  return getAnnouncementsByUserId('default_user_123');
}
