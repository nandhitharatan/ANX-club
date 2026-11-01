import { ProjectInfo } from '@/modules/module2/types/dashboard';

export interface UserProject extends ProjectInfo {
  userId: string;
  tasksCount: number;
  reviewsCount: number;
}

export const projects: UserProject[] = [
  // Rohit Palaram (user_rohit) projects
  {
    id: 'proj_rohit_01',
    userId: 'user_rohit',
    title: 'A.N.X Platform Core',
    description: 'Developing high-throughput microservices for the core platform gateway.',
    status: 'in-progress',
    role: 'Lead Architect',
    tasksCount: 24,
    reviewsCount: 8
  },
  {
    id: 'proj_rohit_02',
    userId: 'user_rohit',
    title: 'Distributed Analytics Gateway',
    description: 'Implementing distributed caching layers and BFF API endpoints.',
    status: 'completed',
    role: 'Principal Engineer',
    tasksCount: 42,
    reviewsCount: 15
  },

  // Jane Doe (user_jane) projects
  {
    id: 'proj_jane_01',
    userId: 'user_jane',
    title: 'A.N.X Member Dashboard',
    description: 'Aggregator backend development and resilience tests for Module 2.',
    status: 'in-progress',
    role: 'Lead Backend Developer',
    tasksCount: 15,
    reviewsCount: 4
  },

  // Alex Smith (user_alex) projects
  {
    id: 'proj_alex_01',
    userId: 'user_alex',
    title: 'Component Library Upgrade',
    description: 'Migrating legacy design assets to modern component tokens.',
    status: 'in-progress',
    role: 'UI Developer',
    tasksCount: 8,
    reviewsCount: 2
  },

  // Emma Watson (user_emma) projects
  {
    id: 'proj_emma_01',
    userId: 'user_emma',
    title: 'Analytics Integration',
    description: 'Hooking up Google Tag Manager and segment reports.',
    status: 'completed',
    role: 'Data Lead',
    tasksCount: 12,
    reviewsCount: 3
  },

  // David Miller (user_david) projects
  {
    id: 'proj_david_01',
    userId: 'user_david',
    title: 'API Middleware Dev',
    description: 'Setting up authorization gateways for internal API calls.',
    status: 'in-progress',
    role: 'Full Stack Dev',
    tasksCount: 18,
    reviewsCount: 5
  },
  {
    id: 'proj_david_02',
    userId: 'user_david',
    title: 'Portfolio Builder',
    description: 'Building custom developer pages with SSR.',
    status: 'completed',
    role: 'Developer',
    tasksCount: 10,
    reviewsCount: 2
  },

  // Sophia Chen (user_sophia) projects
  {
    id: 'proj_sophia_01',
    userId: 'user_sophia',
    title: 'Figma Design System Revamp',
    description: 'Creating a unified layout paradigm for all web components.',
    status: 'in-progress',
    role: 'Principal Designer',
    tasksCount: 14,
    reviewsCount: 4
  },

  // Liam Johnson (user_liam) projects
  {
    id: 'proj_liam_01',
    userId: 'user_liam',
    title: 'iOS Swift App Migration',
    description: 'Refactoring mobile codebases to async/await swift syntax.',
    status: 'in-progress',
    role: 'Mobile Dev',
    tasksCount: 12,
    reviewsCount: 3
  },

  // Olivia Taylor (user_olivia) projects
  {
    id: 'proj_olivia_01',
    userId: 'user_olivia',
    title: 'AWS Infrastructure Automation',
    description: 'Provisioning multi-region ECS clusters using Terraform IaC.',
    status: 'completed',
    role: 'Lead Architect',
    tasksCount: 38,
    reviewsCount: 9
  },

  // Noah Brown (user_noah) projects
  {
    id: 'proj_noah_01',
    userId: 'user_noah',
    title: 'CI/CD Pipeline Optimization',
    description: 'Reducing GitHub Action build times and caching npm modules.',
    status: 'in-progress',
    role: 'DevOps Lead',
    tasksCount: 11,
    reviewsCount: 3
  },

  // Isabella Garcia (user_isabella) projects
  {
    id: 'proj_isabella_01',
    userId: 'user_isabella',
    title: 'Product Roadmap Q3',
    description: 'Defining key milestones and feature specifications for scaling.',
    status: 'in-progress',
    role: 'Product Manager',
    tasksCount: 9,
    reviewsCount: 2
  }
];
