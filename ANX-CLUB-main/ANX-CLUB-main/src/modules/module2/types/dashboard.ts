export interface UserProfile {
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  overallProgress?: number;
  programProgress?: { name: string; progress: number }[];
}

export interface MembershipInfo {
  id?: string;
  userId?: string;
  tier?: string;
  status?: string;
  expiresAt?: string;
  isPremium?: boolean;
  upgradeCTA?: {
    text: string;
    link: string;
  };
}

export interface PlatformEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  registeredAt?: string;
}

export interface MentorBooking {
  id: string;
  mentorName: string;
  dateTime: string;
  topic: string;
  status: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string;
}

export interface ProjectInfo {
  id: string;
  title: string;
  description: string;
  status: string;
  role: string;
}

export interface DashboardResponse {
  user: UserProfile | Record<string, never>;
  membership: MembershipInfo | Record<string, never>;
  upcomingEvents: PlatformEvent[];
  registeredEvents: PlatformEvent[];
  mentorBookings: MentorBooking[];
  announcements: Announcement[];
  recommendations: Recommendation[];
  projects: ProjectInfo[];
  meta: {
    version: string;
    timestamp: string;
    trace?: {
      service: string;
      status: 'fulfilled' | 'rejected';
      durationMs: number;
      error?: string;
    }[];
  };
}
