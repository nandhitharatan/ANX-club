import { UserProfile, MembershipInfo } from '@/modules/module2/types/dashboard';

export interface UserRecord {
  id: string;
  user: UserProfile;
  membership: MembershipInfo;
  overallProgress: number;
  programProgress: { name: string; progress: number }[];
}

export const users: UserRecord[] = [
  {
    id: 'user_rohit',
    user: {
      uid: 'user_rohit',
      name: 'Rohit Palaram',
      email: 'rohit@example.com',
      role: 'Founder & Lead Architect',
      createdAt: '2025-01-01T08:00:00Z',
    },
    membership: {
      id: 'mem_rohit',
      userId: 'user_rohit',
      tier: 'Enterprise',
      status: 'active',
      expiresAt: '2027-06-01T00:00:00Z',
    },
    overallProgress: 92,
    programProgress: [
      { name: 'System Architecture', progress: 98 },
      { name: 'Cloud Scale Deployment', progress: 85 }
    ]
  },
  {
    id: 'user_jane',
    user: {
      uid: 'user_jane',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      role: 'Lead Backend Developer',
      createdAt: '2026-01-15T08:00:00Z',
    },
    membership: {
      id: 'mem_jane',
      userId: 'user_jane',
      tier: 'Premium',
      status: 'active',
      expiresAt: '2027-01-15T00:00:00Z',
    },
    overallProgress: 76,
    programProgress: [
      { name: 'Backend Foundations', progress: 100 },
      { name: 'Microservices & BFF', progress: 68 }
    ]
  },
  {
    id: 'user_alex',
    user: {
      uid: 'user_alex',
      name: 'Alex Smith',
      email: 'alex.smith@example.com',
      role: 'Frontend UI Engineer',
      createdAt: '2026-02-10T10:30:00Z',
    },
    membership: {
      id: 'mem_alex',
      userId: 'user_alex',
      tier: 'Basic',
      status: 'active',
      expiresAt: '2026-12-10T00:00:00Z',
    },
    overallProgress: 52,
    programProgress: [
      { name: 'React State Management', progress: 85 },
      { name: 'CSS Grid & Flexbox', progress: 34 }
    ]
  },
  {
    id: 'user_emma',
    user: {
      uid: 'user_emma',
      name: 'Emma Watson',
      email: 'emma.watson@example.com',
      role: 'Data Analyst',
      createdAt: '2025-10-01T09:00:00Z',
    },
    membership: {
      id: 'mem_emma',
      userId: 'user_emma',
      tier: 'Basic',
      status: 'expired',
      expiresAt: '2026-04-01T00:00:00Z',
    },
    overallProgress: 45,
    programProgress: [
      { name: 'Data Visualisation', progress: 70 },
      { name: 'SQL Query Tuning', progress: 20 }
    ]
  },
  {
    id: 'user_david',
    user: {
      uid: 'user_david',
      name: 'David Miller',
      email: 'david.miller@example.com',
      role: 'Full Stack Apprentice',
      createdAt: '2026-03-01T08:00:00Z',
    },
    membership: {
      id: 'mem_david',
      userId: 'user_david',
      tier: 'Premium',
      status: 'active',
      expiresAt: '2027-02-28T00:00:00Z',
    },
    overallProgress: 60,
    programProgress: [
      { name: 'Node.js & Express', progress: 80 },
      { name: 'Client-side SPA', progress: 40 }
    ]
  },
  {
    id: 'user_sophia',
    user: {
      uid: 'user_sophia',
      name: 'Sophia Chen',
      email: 'sophia.chen@example.com',
      role: 'UI/UX Designer',
      createdAt: '2026-01-20T11:00:00Z',
    },
    membership: {
      id: 'mem_sophia',
      userId: 'user_sophia',
      tier: 'Premium',
      status: 'active',
      expiresAt: '2026-11-20T00:00:00Z',
    },
    overallProgress: 80,
    programProgress: [
      { name: 'Design Tokens', progress: 95 },
      { name: 'Responsive Layouts', progress: 65 }
    ]
  },
  {
    id: 'user_liam',
    user: {
      uid: 'user_liam',
      name: 'Liam Johnson',
      email: 'liam.johnson@example.com',
      role: 'Mobile App Developer',
      createdAt: '2026-04-12T09:00:00Z',
    },
    membership: {
      id: 'mem_liam',
      userId: 'user_liam',
      tier: 'Basic',
      status: 'pending',
      expiresAt: '2026-06-01T00:00:00Z',
    },
    overallProgress: 30,
    programProgress: [
      { name: 'React Native Basics', progress: 60 },
      { name: 'Native Modules Bridge', progress: 0 }
    ]
  },
  {
    id: 'user_olivia',
    user: {
      uid: 'user_olivia',
      name: 'Olivia Taylor',
      email: 'olivia.taylor@example.com',
      role: 'Cloud Architect',
      createdAt: '2025-05-01T08:00:00Z',
    },
    membership: {
      id: 'mem_olivia',
      userId: 'user_olivia',
      tier: 'Enterprise',
      status: 'active',
      expiresAt: '2027-05-01T00:00:00Z',
    },
    overallProgress: 88,
    programProgress: [
      { name: 'AWS Orchestration', progress: 90 },
      { name: 'Terraform IaC Modules', progress: 86 }
    ]
  },
  {
    id: 'user_noah',
    user: {
      uid: 'user_noah',
      name: 'Noah Brown',
      email: 'noah.brown@example.com',
      role: 'DevOps Engineer',
      createdAt: '2026-02-15T14:00:00Z',
    },
    membership: {
      id: 'mem_noah',
      userId: 'user_noah',
      tier: 'Basic',
      status: 'active',
      expiresAt: '2026-10-15T00:00:00Z',
    },
    overallProgress: 65,
    programProgress: [
      { name: 'Docker Containerization', progress: 90 },
      { name: 'Kubernetes Cluster Ops', progress: 40 }
    ]
  },
  {
    id: 'user_isabella',
    user: {
      uid: 'user_isabella',
      name: 'Isabella Garcia',
      email: 'isabella.garcia@example.com',
      role: 'Product Manager',
      createdAt: '2026-01-05T09:00:00Z',
    },
    membership: {
      id: 'mem_isabella',
      userId: 'user_isabella',
      tier: 'Premium',
      status: 'active',
      expiresAt: '2026-09-30T00:00:00Z',
    },
    overallProgress: 70,
    programProgress: [
      { name: 'Agile & Scrum Framework', progress: 85 },
      { name: 'Product Growth Metrics', progress: 55 }
    ]
  }
];
