import { Announcement } from '@/modules/module2/types/dashboard';

export interface UserAnnouncement extends Announcement {
  userId?: string; // Optional: targets a specific user. If undefined, it is global.
}

export const announcements: UserAnnouncement[] = [
  {
    id: 'ann_global_01',
    title: 'Welcome to V1 Platform Beta',
    content: 'Module 2 Member Dashboard BFF API is officially live and resilient. Start exploring your registered live events and mentor bookings.',
    publishedAt: '2026-05-23T12:00:00Z',
    priority: 'high'
  },
  {
    id: 'ann_global_02',
    title: 'Platform Maintenance Notice',
    content: 'Scheduled database migration will occur this Sunday between 02:00 and 04:00 UTC. Expect short intervals of intermittent connectivity.',
    publishedAt: '2026-05-25T18:00:00Z',
    priority: 'medium'
  },
  {
    id: 'ann_global_03',
    title: 'New Design Variable Tokens',
    content: 'Check out the new global design variables and glassmorphism styling structures available in the CSS codebase.',
    publishedAt: '2026-05-24T09:00:00Z',
    priority: 'low'
  },
  {
    id: 'ann_emma_expired',
    userId: 'user_emma',
    title: 'Subscription Expired Notice',
    content: 'Your basic membership expired on April 1st. Access to personalized mentor sessions has been temporarily paused. Please renew to resume access.',
    publishedAt: '2026-04-02T08:00:00Z',
    priority: 'high'
  },
  {
    id: 'ann_david_sync',
    userId: 'user_david',
    title: 'Apprentice Sync Meeting',
    content: 'Our weekly check-in is scheduled for Friday at 4 PM. Please bring your component templates.',
    publishedAt: '2026-05-25T14:00:00Z',
    priority: 'low'
  },
  {
    id: 'ann_liam_pending',
    userId: 'user_liam',
    title: 'Billing Review Pending',
    content: 'Your manual bank draft payment is currently undergoing standard bank clearance verification. Premium services will trigger upon approval.',
    publishedAt: '2026-05-25T10:00:00Z',
    priority: 'high'
  },
  {
    id: 'ann_olivia_billing',
    userId: 'user_olivia',
    title: 'Enterprise Invoice Settled',
    content: 'We have processed the company invoice. Your subscription credentials have been successfully extended.',
    publishedAt: '2026-05-20T11:00:00Z',
    priority: 'low'
  }
];
