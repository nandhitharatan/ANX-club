import { MentorBooking } from '@/modules/module2/types/dashboard';

export interface UserBooking extends MentorBooking {
  userId: string;
}

export const bookings: UserBooking[] = [
  // Rohit Palaram (user_rohit) bookings
  {
    id: 'booking_rohit_01',
    userId: 'user_rohit',
    mentorName: 'Alex Rivera',
    dateTime: '2026-05-28T14:00:00Z',
    topic: 'Distributed Cache Strategies & Edge Gateways',
    status: 'confirmed'
  },

  // Jane Doe (user_jane) bookings
  {
    id: 'booking_jane_01',
    userId: 'user_jane',
    mentorName: 'Alex Rivera',
    dateTime: '2026-05-28T14:00:00Z',
    topic: 'Backend Architecture & BFF Integration',
    status: 'confirmed'
  },

  // Alex Smith (user_alex) bookings
  {
    id: 'booking_alex_01',
    userId: 'user_alex',
    mentorName: 'Sarah Jenkins',
    dateTime: '2026-05-30T10:00:00Z',
    topic: 'Advanced CSS & Responsive Designs',
    status: 'confirmed'
  },

  // David Miller (user_david) bookings
  {
    id: 'booking_david_01',
    userId: 'user_david',
    mentorName: 'Ryan Reynolds',
    dateTime: '2026-06-02T16:00:00Z',
    topic: 'Node.js Performance Tuning',
    status: 'pending'
  },

  // Sophia Chen (user_sophia) bookings
  {
    id: 'booking_sophia_01',
    userId: 'user_sophia',
    mentorName: 'Sarah Jenkins',
    dateTime: '2026-05-29T11:00:00Z',
    topic: 'Design System Typography',
    status: 'confirmed'
  },

  // Liam Johnson (user_liam) bookings
  {
    id: 'booking_liam_01',
    userId: 'user_liam',
    mentorName: 'Marco Polo',
    dateTime: '2026-05-27T09:00:00Z',
    topic: 'Swift Concurrency & Actors',
    status: 'confirmed'
  },

  // Olivia Taylor (user_olivia) bookings
  {
    id: 'booking_olivia_01',
    userId: 'user_olivia',
    mentorName: 'Alex Rivera',
    dateTime: '2026-05-28T16:00:00Z',
    topic: 'Terraform Modules & AWS',
    status: 'confirmed'
  },

  // Isabella Garcia (user_isabella) bookings
  {
    id: 'booking_isabella_01',
    userId: 'user_isabella',
    mentorName: 'David Warner',
    dateTime: '2026-05-31T15:00:00Z',
    topic: 'Agile Methodologies & Scrum',
    status: 'confirmed'
  }
];
