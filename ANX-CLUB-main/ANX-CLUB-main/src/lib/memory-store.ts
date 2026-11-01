import { MOCK_EVENTS, MOCK_MENTORS, MOCK_RESOURCES } from './constants';
import { DEFAULT_NATIVE_ROADMAPS } from './roadmaps';

// In-memory persistent caches for real-time reflection across Admin and User workflows
export interface MemoryEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration?: number;
  venue?: string;
  isOnline?: boolean;
  meetingLink?: string;
  speaker?: string;
  speakerBio?: string;
  speakerImage?: string;
  category?: string;
  eventType?: string;
  price?: number;
  premiumPrice?: number;
  premiumOnly?: boolean;
  registrationDeadline?: string | null;
  capacity?: number;
  seatsAvailable?: number;
  seatsBooked?: number;
  registeredCount?: number;
  posterUrl?: string;
  onlineLink?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  status?: string;
}

export interface MemoryReviewRequest {
  id: string;
  memberId: string;
  userName: string;
  userEmail: string;
  type: string;
  fileUrl?: string | null;
  fileName?: string;
  targetRole: string;
  notes?: string;
  status: string; // 'Pending' | 'InReview' | 'Completed'
  mentorFeedback?: any;
  assignedMentorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryMentorBooking {
  id: string;
  mentorId: string;
  mentorName: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  topic: string;
  preferredDate: string;
  preferredTime: string;
  date?: string;
  time?: string;
  message?: string;
  status: string; // 'Pending' | 'Approved' | 'Rejected' | 'Completed'
  meetingLink?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MemoryProposal {
  id: string;
  title: string;
  problemStatement: string;
  proposedSolution: string;
  targetUsers?: string | null;
  techStack?: string[] | string;
  status: string;
  pdfFileName?: string | null;
  pdfUrl?: string | null;
  proposalPdf?: string | null;
  submitterId?: string;
  adminFeedback?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface MemoryRegistration {
  id: string;
  eventId: string;
  eventTitle?: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  membershipType?: string;
  status: string;
  paymentStatus?: string;
  amount?: number;
  registeredAt: string;
}

// Global memory cache attached to globalThis to survive Next.js dev reloads
/* eslint-disable no-var */
declare global {
  var __ANX_MEMORY_STORE__: {
    events: MemoryEvent[];
    reviews: MemoryReviewRequest[];
    bookings: MemoryMentorBooking[];
    proposals: MemoryProposal[];
    registrations: MemoryRegistration[];
    roadmaps: any[];
    resources: any[];
  } | undefined;
}

if (!globalThis.__ANX_MEMORY_STORE__) {
  globalThis.__ANX_MEMORY_STORE__ = {
    events: [...(MOCK_EVENTS as any[])],
    resources: [...(MOCK_RESOURCES as any[])],
    reviews: [
      {
        id: 'rev-101',
        memberId: 'usr_rohit',
        userName: 'Rohit Verma',
        userEmail: 'rohit.v@example.com',
        type: 'resume',
        fileName: 'Rohit_Verma_SDE_Resume.pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        targetRole: 'Full Stack Engineer @ Google',
        notes: 'Focus on distributed systems and microservices section.',
        status: 'Pending',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'rev-102',
        memberId: 'usr_ananya',
        userName: 'Ananya Sharma',
        userEmail: 'ananya.s@example.com',
        type: 'portfolio',
        fileName: 'Ananya_UI_UX_CaseStudy.pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        targetRole: 'Product Designer @ Stripe',
        notes: 'Looking for feedback on design systems and typography.',
        status: 'InReview',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      }
    ],
    bookings: [
      {
        id: 'bk-201',
        mentorId: 'm-1',
        mentorName: 'Priya Nair',
        memberId: 'usr_arjun',
        memberName: 'Arjun Mehta',
        memberEmail: 'arjun.m@example.com',
        topic: 'System Architecture & Scaling React Apps',
        preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        preferredTime: '04:00 PM',
        status: 'Pending',
        message: 'Preparing for Senior SDE interviews next month.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'bk-202',
        mentorId: 'm-2',
        mentorName: 'Vikram Seth',
        memberId: 'usr_sneha',
        memberName: 'Sneha Patel',
        memberEmail: 'sneha.p@example.com',
        topic: 'AI Agent Pipelines and LLM Orchestration',
        preferredDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        preferredTime: '11:00 AM',
        status: 'Approved',
        meetingLink: 'https://meet.google.com/xyz-anx-mentor',
        message: 'Need feedback on my LangChain multi-agent project.',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      }
    ],
    proposals: [
      {
        id: 'idea-301',
        title: 'NeuroShield - Edge AI Cyber Defenses',
        problemStatement: 'Modern IoT fleets lack lightweight intrusion prevention capable of sub-millisecond local inference.',
        proposedSolution: 'Rust-based WASM micro-runtime that runs on ARM microcontrollers with real-time anomaly isolation.',
        targetUsers: 'Smart Factory & EV Fleet Operators',
        techStack: ['Rust', 'WebAssembly', 'TensorFlow Lite', 'Next.js'],
        status: 'Under Review',
        pdfFileName: 'NeuroShield_Whitepaper_v2.pdf',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        submitterId: 'usr_karthik',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'idea-302',
        title: 'CampusPact - Decentralized Student Micro-Grants',
        problemStatement: 'Student builders struggle to secure early $500 seed funding without giving away equity.',
        proposedSolution: 'Community-staked milestone bounty escrow with automated proof-of-ship verification.',
        targetUsers: 'University Developer Clubs & Hackathon Winners',
        techStack: ['Solidity', 'Next.js', 'Ethers.js', 'TailwindCSS'],
        status: 'Approved',
        pdfFileName: 'CampusPact_Proposal.pdf',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        submitterId: 'usr_meera',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      }
    ],
    registrations: [
      {
        id: 'reg-evt-1-1',
        eventId: 'evt-1',
        eventTitle: 'React 19 Deep Dive',
        userId: 'usr_rohit',
        name: 'Rohit Verma',
        email: 'rohit.v@example.com',
        phone: '+91 98765 43210',
        membershipType: 'free',
        status: 'confirmed',
        registeredAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'reg-evt-1-2',
        eventId: 'evt-1',
        eventTitle: 'React 19 Deep Dive',
        userId: 'usr_priya',
        name: 'Priya Sharma',
        email: 'priya.s@example.com',
        phone: '+91 98765 12345',
        membershipType: 'premium',
        status: 'confirmed',
        registeredAt: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ],
    roadmaps: [...DEFAULT_NATIVE_ROADMAPS]
  };
}

export const memoryStore = globalThis.__ANX_MEMORY_STORE__;

// Event Store Helpers
export function getMemoryEvents(): MemoryEvent[] {
  return memoryStore.events;
}

export function addMemoryEvent(event: MemoryEvent): void {
  const existingIdx = memoryStore.events.findIndex(e => e.id === event.id);
  if (existingIdx >= 0) {
    memoryStore.events[existingIdx] = { ...memoryStore.events[existingIdx], ...event };
  } else {
    memoryStore.events.unshift(event);
  }
}

export function findMemoryEvent(id: string): MemoryEvent | undefined {
  return memoryStore.events.find(e => e.id === id);
}

// Review Requests Helpers
export function getMemoryReviews(): MemoryReviewRequest[] {
  return memoryStore.reviews;
}

export function addMemoryReview(review: MemoryReviewRequest): void {
  const existingIdx = memoryStore.reviews.findIndex(r => r.id === review.id);
  if (existingIdx >= 0) {
    memoryStore.reviews[existingIdx] = { ...memoryStore.reviews[existingIdx], ...review };
  } else {
    memoryStore.reviews.unshift(review);
  }
}

export function updateMemoryReview(id: string, updates: Partial<MemoryReviewRequest>): void {
  const existing = memoryStore.reviews.find(r => r.id === id);
  if (existing) {
    Object.assign(existing, updates);
  }
}

// Mentor Bookings Helpers
export function getMemoryBookings(): MemoryMentorBooking[] {
  return memoryStore.bookings;
}

export function addMemoryBooking(booking: MemoryMentorBooking): void {
  const existingIdx = memoryStore.bookings.findIndex(b => b.id === booking.id);
  if (existingIdx >= 0) {
    memoryStore.bookings[existingIdx] = { ...memoryStore.bookings[existingIdx], ...booking };
  } else {
    memoryStore.bookings.unshift(booking);
  }
}

export function updateMemoryBooking(id: string, updates: Partial<MemoryMentorBooking>): void {
  const existing = memoryStore.bookings.find(b => b.id === id);
  if (existing) {
    Object.assign(existing, updates);
  }
}

// Proposal Helpers
export function getMemoryProposals(): MemoryProposal[] {
  return memoryStore.proposals;
}

export function addMemoryProposal(proposal: MemoryProposal): void {
  const existingIdx = memoryStore.proposals.findIndex(p => p.id === proposal.id);
  if (existingIdx >= 0) {
    memoryStore.proposals[existingIdx] = { ...memoryStore.proposals[existingIdx], ...proposal };
  } else {
    memoryStore.proposals.unshift(proposal);
  }
}

export function updateMemoryProposal(id: string, updates: Partial<MemoryProposal>): void {
  const existing = memoryStore.proposals.find(p => p.id === id);
  if (existing) {
    Object.assign(existing, updates);
  }
}

// Registration Helpers
export function getMemoryRegistrations(eventId?: string): MemoryRegistration[] {
  if (eventId) {
    return memoryStore.registrations.filter(r => r.eventId === eventId);
  }
  return memoryStore.registrations;
}

export function addMemoryRegistration(reg: MemoryRegistration): void {
  const existing = memoryStore.registrations.find(r => r.eventId === reg.eventId && r.userId === reg.userId);
  if (!existing) {
    memoryStore.registrations.unshift(reg);
  }
}

// Roadmap Helpers
export function getMemoryRoadmaps(): any[] {
  return memoryStore.roadmaps;
}

export function addMemoryRoadmap(roadmap: any): void {
  const existingIdx = memoryStore.roadmaps.findIndex(r => r.id === roadmap.id);
  if (existingIdx >= 0) {
    memoryStore.roadmaps[existingIdx] = { ...memoryStore.roadmaps[existingIdx], ...roadmap };
  } else {
    memoryStore.roadmaps.unshift(roadmap);
  }
}

// Resource Helpers
export function getMemoryResources(): any[] {
  return memoryStore.resources;
}

export function addMemoryResource(resource: any): void {
  const existingIdx = memoryStore.resources.findIndex(r => r.id === resource.id);
  if (existingIdx >= 0) {
    memoryStore.resources[existingIdx] = { ...memoryStore.resources[existingIdx], ...resource };
  } else {
    memoryStore.resources.unshift(resource);
  }
}

