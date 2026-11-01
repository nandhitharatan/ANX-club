export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: 'Visitor' | 'Member' | 'Mentor' | 'Admin';
  membershipTier?: 'Basic' | 'Premium' | 'Enterprise';
  membershipType?: string; // Matches existing database fields
  status?: 'Active' | 'Expired' | 'Pending';
  joinedDate?: string;
  phoneNumber?: string;
  collegeName?: string;
  yearBranch?: string;
  skills?: string;
  interests?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  venue?: string;          // Module 4 venue
  location?: string;       // Module 2 location
  price: number;
  premiumPrice?: number;
  capacity?: number;
  seats?: number;          // Module 3 seats limit
  seatsAvailable?: number | null; // Module 4 seats available
  seatsBooked?: number;    // Module 4 seats booked
  hostId?: string;
  organizerId?: string;    // Module 3 organizer
  speaker?: string;        // Module 3 speaker
  speakerName?: string;    // Module 4 speaker
  speakerRole?: string;    // Speaker designation
  speakerCompany?: string; // Company or organization
  speakerBio?: string;     // Speaker biography
  speakerImage?: string;   // Speaker image URL
  address?: string;        // Detailed physical address
  agenda?: string[];       // Session schedule slots
  meetingLink?: string;    // Meeting URL
  meetingPlatform?: string;// Video platform (Google Meet, Zoom, etc.)
  meetingId?: string;      // Meeting identifier
  meetingPasscode?: string;// Meeting passcode
  meetingInstructions?: string; // Access instructions
  eventType?: 'free' | 'paid' | 'premium' | 'member-only' | string;
  type?: string;           // Module 3 event type (free/paid/premium)
  memberOnly?: boolean;
  posterUrl?: string;
  onlineLink?: string;
  isActive?: boolean;
  status?: 'Draft' | 'Published' | 'Cancelled' | 'Approved' | 'Pending' | 'Rejected' | 'Deleted' | string;
  isPublished?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  publishedAt?: string;
  unpublishedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
  registeredCount?: number;
  registrationDeadline?: string | null;
  collegeId?: string;
  collegeName?: string;
  registrationType?: 'internal' | 'external';
  externalRegistrationUrl?: string;
  createdByRole?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle?: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  membershipType?: string;
  college?: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  paymentStatus?: 'not_required' | 'pending' | 'paid' | 'refunded';
  paymentId?: string | null;
  orderId?: string | null;
  amount?: number;
  ticketId?: string;
  seatNumber?: string;
  qrCodeUrl?: string;
  registeredAt: string;
}

export interface EventReport {
  id: string;
  eventId: string;
  eventTitle: string;
  collegeId: string;
  collegeName: string;
  submittedBy: string;
  submittedByName?: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Revision Requested';
  summary: string;
  attendanceCount?: number;
  highlights?: string[];
  mediaUrls?: string[];
  adminFeedback?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  skills: string[];
  rating: number;
  totalReviews: number;
  hourlyRate: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  role: string;
  members?: string[];
  userId?: string;
  createdAt?: string;
}
