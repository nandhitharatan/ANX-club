import { PlatformEvent } from '@/modules/module2/types/dashboard';

export const upcomingEvents: PlatformEvent[] = [
  {
    id: 'event_001',
    title: 'A.N.X V1 Platform Kickoff',
    date: '2026-06-01T18:00:00Z',
    location: 'Virtual Platform Main Stage',
    description: 'Welcome to the V1 platform kickoff event with the team.'
  },
  {
    id: 'event_002',
    title: 'Next.js 14 App Router Deep Dive',
    date: '2026-06-15T15:00:00Z',
    location: 'Virtual Room A',
    description: 'Mastering routing, server actions, and BFF integration.'
  },
  {
    id: 'event_003',
    title: 'Tailwind CSS Best Practices',
    date: '2026-06-20T17:00:00Z',
    location: 'Virtual Room B',
    description: 'Learn utility-first styling patterns for modern SaaS apps.'
  },
  {
    id: 'event_004',
    title: 'PowerBI & SQL Bootcamp',
    date: '2026-06-05T14:00:00Z',
    location: 'Lab Room 3',
    description: 'Hands-on bootcamp building complex analytical dashboards.'
  },
  {
    id: 'event_005',
    title: 'UI/UX Design Masterclass',
    date: '2026-06-10T10:00:00Z',
    location: 'Virtual Room A',
    description: 'Learn modern UI animations, interactive prototyping, and typography.'
  },
  {
    id: 'event_006',
    title: 'React Native vs Flutter Panel',
    date: '2026-06-25T13:00:00Z',
    location: 'Virtual Auditorium',
    description: 'Industry experts discuss cross-platform mobile frameworks.'
  },
  {
    id: 'event_007',
    title: 'AWS Cloud Practitioner Prep',
    date: '2026-06-08T09:00:00Z',
    location: 'Virtual Room D',
    description: 'Reviewing key VPC, EC2, and IAM configurations.'
  },
  {
    id: 'event_008',
    title: 'Kubernetes in Production',
    date: '2026-06-12T15:00:00Z',
    location: 'Virtual Room C',
    description: 'Troubleshooting pods, nodes, networking and ingress policies.'
  },
  {
    id: 'event_009',
    title: 'Agile Product Owner Workshop',
    date: '2026-06-04T10:00:00Z',
    location: 'Virtual Sandbox Room',
    description: 'Writing actionable user stories, epics, and managing backlogs.'
  },
  {
    id: 'event_010',
    title: 'OWASP Top 10 Deep Dive',
    date: '2026-06-22T14:00:00Z',
    location: 'Security Lab 1',
    description: 'Breaking down recent security breaches, SSRF, and injection vectors.'
  }
];

export interface EventRegistration {
  userId: string;
  eventId: string;
  registeredAt: string;
}

export const eventRegistrations: EventRegistration[] = [
  // Rohit Palaram (user_rohit) registrations
  { userId: 'user_rohit', eventId: 'event_001', registeredAt: '2026-05-10T10:00:00Z' },
  { userId: 'user_rohit', eventId: 'event_002', registeredAt: '2026-05-12T14:00:00Z' },
  { userId: 'user_rohit', eventId: 'event_007', registeredAt: '2026-05-15T09:00:00Z' },

  // Jane Doe (user_jane) registrations
  { userId: 'user_jane', eventId: 'event_001', registeredAt: '2026-05-20T10:00:00Z' },
  { userId: 'user_jane', eventId: 'event_002', registeredAt: '2026-05-21T11:00:00Z' },

  // Alex Smith (user_alex) registrations
  { userId: 'user_alex', eventId: 'event_002', registeredAt: '2026-05-22T14:00:00Z' },
  { userId: 'user_alex', eventId: 'event_003', registeredAt: '2026-05-23T09:00:00Z' },

  // David Miller (user_david) registrations
  { userId: 'user_david', eventId: 'event_001', registeredAt: '2026-05-21T09:00:00Z' },
  { userId: 'user_david', eventId: 'event_002', registeredAt: '2026-05-23T10:00:00Z' },

  // Sophia Chen (user_sophia) registrations
  { userId: 'user_sophia', eventId: 'event_005', registeredAt: '2026-05-18T16:00:00Z' },

  // Liam Johnson (user_liam) registrations
  { userId: 'user_liam', eventId: 'event_006', registeredAt: '2026-05-24T12:00:00Z' },

  // Olivia Taylor (user_olivia) registrations
  { userId: 'user_olivia', eventId: 'event_007', registeredAt: '2026-05-15T09:00:00Z' },

  // Isabella Garcia (user_isabella) registrations
  { userId: 'user_isabella', eventId: 'event_009', registeredAt: '2026-05-19T11:00:00Z' }
];
