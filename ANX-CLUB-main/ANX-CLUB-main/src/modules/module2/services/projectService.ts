import {adminDb, logFirestoreFallback} from '@/lib/firebase/admin';
const db = adminDb;
import { ProjectInfo } from '@/modules/module2/types/dashboard';
import { getProjectsByUserId } from '@/modules/module2/data';
import * as admin from 'firebase-admin';

export async function getProjects(
  userId: string,
  mock = false,
  fail = false
): Promise<ProjectInfo[]> {
  if (fail) {
    throw new Error('Simulated failure in Project Service');
  }

  if (db && !mock) {
    try {
      const membersQuery = db.collection('projects')
        .where('members', 'array-contains', userId)
        .get();

      const directQuery = db.collection('projects')
        .where('userId', '==', userId)
        .get();

      const [membersSnapshot, directSnapshot] = await Promise.all([
        membersQuery,
        directQuery
      ]);

      const projectsMap = new Map<string, ProjectInfo>();

      const addDocs = (snapshot: admin.firestore.QuerySnapshot) => {
        snapshot.forEach(doc => {
          const data = doc.data();
          projectsMap.set(doc.id, {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            status: data.status || '',
            role: data.role || '',
          });
        });
      };

      addDocs(membersSnapshot);
      addDocs(directSnapshot);

      return Array.from(projectsMap.values());
    } catch (error) {
      logFirestoreFallback('Projects service', error);
    }
  }

  // Fallback / Mock data from Data Layer
  return getProjectsByUserId(userId);
}
