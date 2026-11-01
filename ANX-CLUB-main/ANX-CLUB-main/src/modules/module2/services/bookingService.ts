import {adminDb, logFirestoreFallback} from '@/lib/firebase/admin';
const db = adminDb;
import { MentorBooking } from '@/modules/module2/types/dashboard';
import { getBookingsByUserId } from '@/modules/module2/data';

export async function getMentorBookings(
  userId: string,
  mock = false,
  fail = false
): Promise<MentorBooking[]> {
  if (fail) {
    throw new Error('Simulated failure in Mentor Booking Service');
  }

  if (db && !mock) {
    try {
      const snapshot = await db.collection('mentorBookings')
        .where('userId', '==', userId)
        .orderBy('dateTime', 'asc')
        .get();

      const bookings: MentorBooking[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          mentorName: data.mentorName || '',
          dateTime: data.dateTime || '',
          topic: data.topic || '',
          status: data.status || '',
        });
      });
      return bookings;
    } catch (error) {
      logFirestoreFallback('Mentor bookings service', error);
    }
  }

  // Fallback / Mock data from Data Layer
  return getBookingsByUserId(userId);
}
