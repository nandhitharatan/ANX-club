import { UserRecord, users } from './users';
import { upcomingEvents, eventRegistrations } from './events';
import { UserProject, projects } from './projects';
import { UserBooking, bookings } from './bookings';
import { UserAnnouncement, announcements } from './announcements';
import { Recommendation, PlatformEvent } from '@/modules/module2/types/dashboard';

/**
 * Normalizes email address searches.
 */
function cleanString(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Query: Get a UserRecord by ID or by Email.
 */
export function getUserByIdOrEmail(identifier: string): UserRecord | undefined {
  const cleanId = cleanString(identifier);
  return users.find(
    u => cleanString(u.id) === cleanId || cleanString(u.user.email || '') === cleanId
  );
}

/**
 * Query: Get Membership Info by User ID.
 */
export function getMembershipByUserId(userId: string) {
  const record = getUserByIdOrEmail(userId);
  return record ? record.membership : undefined;
}

/**
 * Query: Get Projects assigned to a User ID.
 */
export function getProjectsByUserId(userId: string): UserProject[] {
  const record = getUserByIdOrEmail(userId);
  if (!record) return [];
  return projects.filter(p => p.userId === record.id);
}

/**
 * Query: Get Mentor Bookings reserved for a User ID.
 */
export function getBookingsByUserId(userId: string): UserBooking[] {
  const record = getUserByIdOrEmail(userId);
  if (!record) return [];
  return bookings.filter(b => b.userId === record.id);
}

/**
 * Query: Get Events registered by a User ID.
 */
export function getRegisteredEventsByUserId(userId: string): PlatformEvent[] {
  const record = getUserByIdOrEmail(userId);
  if (!record) return [];
  
  const userRegs = eventRegistrations.filter(r => r.userId === record.id);
  const registeredIds = new Set(userRegs.map(r => r.eventId));
  
  return upcomingEvents
    .filter(e => registeredIds.has(e.id))
    .map(e => {
      const reg = userRegs.find(r => r.eventId === e.id);
      return {
        ...e,
        registeredAt: reg?.registeredAt
      };
    });
}

/**
 * Query: Get Global Upcoming Events.
 */
export function getUpcomingEventsList(): PlatformEvent[] {
  return upcomingEvents;
}

/**
 * Query: Get Announcements visible to a User ID (both global and user-targeted).
 */
export function getAnnouncementsByUserId(userId: string): UserAnnouncement[] {
  const record = getUserByIdOrEmail(userId);
  const userDbId = record?.id || userId;
  return announcements.filter(a => !a.userId || a.userId === userDbId);
}

/**
 * Query: Expose all users for validation list.
 */
export function getAllUsers() {
  return users;
}

/**
 * Query: Get Recommendations specific to user.
 */
export function getRecommendationsByUserId(userId: string): Recommendation[] {
  const record = getUserByIdOrEmail(userId);
  if (!record) return [];

  const recommendations: Recommendation[] = [];
  const role = record.user.role || '';

  if (role.includes('Architect') || role.includes('Backend')) {
    recommendations.push({
      id: 'rec_01',
      type: 'mentor',
      title: 'Connect with Alex Rivera',
      description: 'Top-rated mentor in Backend Architecture & high-scale gateway protocols.',
      link: '/mentors/alex-rivera'
    });
  }

  if (role.includes('Designer') || role.includes('Frontend') || role.includes('UI')) {
    recommendations.push({
      id: 'rec_02',
      type: 'resource',
      title: 'Design Systems Handbook',
      description: 'Read the latest layout standard tokenization guides on creating glassmorphic dark themes.',
      link: '/resources/design-systems'
    });
  }

  if (role.includes('Analyst')) {
    recommendations.push({
      id: 'rec_03',
      type: 'course',
      title: 'Advanced SQL Query Tuning',
      description: 'Learn index structures, query caching, and analytical tuning operations.',
      link: '/courses/sql-tuning'
    });
  }

  if (role.includes('DevOps') || role.includes('Cloud')) {
    recommendations.push({
      id: 'rec_04',
      type: 'resource',
      title: 'Kubernetes Pod Security Policies',
      description: 'Step-by-step checklist to configure namespaces and limit network interfaces.',
      link: '/resources/k8s-security'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec_default',
      type: 'course',
      title: 'ANX Platform Onboarding Walkthrough',
      description: 'Kickstart program path to discover specializations in software engineering.',
      link: '/courses/onboarding'
    });
  }

  return recommendations;
}
