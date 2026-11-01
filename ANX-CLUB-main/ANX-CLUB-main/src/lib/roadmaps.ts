export interface RoadmapStep {
  id: string;
  title: string;
  description?: string;
  estimatedHours?: number;
  resources?: { label: string; url: string }[];
}

export interface Roadmap {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isPremium: boolean;
  estimatedHours: number;
  imageUrl?: string;
  steps: RoadmapStep[];
  isAiGenerated?: boolean;
  createdBy?: string;
  createdAt?: string;
}

export const DEFAULT_NATIVE_ROADMAPS: Roadmap[] = [
  {
    id: "fullstack-modern",
    title: "Full-Stack Web Architect",
    category: "Full Stack",
    difficulty: "Intermediate",
    description: "End-to-end curriculum covering TypeScript, React 19, Next.js 15, Node.js, Cloud Firestore, PostgreSQL, and AWS deployment.",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop",
    isPremium: false,
    estimatedHours: 120,
    steps: [
      { id: "fs-1", title: "HTML5 Semantic Architecture & Modern CSS/Tailwind", description: "Master responsive layouts, Flexbox/Grid, and accessible component structuring." },
      { id: "fs-2", title: "TypeScript & JavaScript ESNext Mastery", description: "Deep dive into async/await, closures, generics, and strict type safety." },
      { id: "fs-3", title: "React 19 & Component Design Systems", description: "Server Components, Hooks, Context, state machines, and memoization." },
      { id: "fs-4", title: "Next.js App Router & Server Actions", description: "Dynamic routing, parallel routes, streaming SSR, and edge middleware." },
      { id: "fs-5", title: "Backend APIs, REST & GraphQL Design", description: "Secure authentication, rate limiting, and structured JSON endpoints." },
      { id: "fs-6", title: "Databases: PostgreSQL, Prisma & Firestore Dual-Writes", description: "ACID transactions, relational indexing, and real-time document listeners." },
      { id: "fs-7", title: "CI/CD, Docker & Production Cloud Deployment", description: "Automated GitHub Actions pipelines, containerization, and monitoring." }
    ]
  },
  {
    id: "ai-engineer",
    title: "Applied AI & LLM Systems Engineer",
    category: "AI / ML",
    difficulty: "Advanced",
    description: "Build production AI agent applications using LangChain, RAG architectures, Vector DBs (Pinecone/Chroma), and Ollama/OpenAI APIs.",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    isPremium: true,
    estimatedHours: 140,
    steps: [
      { id: "ai-1", title: "Python for AI & Vector Mathematics", description: "NumPy, Pandas, embeddings math, and cosine similarity calculations." },
      { id: "ai-2", title: "LLM Fundamentals & Prompt Engineering", description: "Zero-shot, Few-shot, Chain-of-Thought, and structured output schemas." },
      { id: "ai-3", title: "Retrieval Augmented Generation (RAG)", description: "Document chunking, hybrid search, rerankers, and Pinecone vector store." },
      { id: "ai-4", title: "Autonomous Agent Architectures & Tool Calling", description: "ReAct pattern, LangGraph stateful agents, and API integrations." },
      { id: "ai-5", title: "Local Inference with Ollama & HuggingFace Models", description: "Running Llama 3, DeepSeek, and Mistral models on local GPUs/servers." },
      { id: "ai-6", title: "Fine-Tuning & Quantization (QLoRA)", description: "Dataset curation, parameter-efficient fine-tuning, and model evaluations." }
    ]
  },
  {
    id: "devops-cloud",
    title: "Cloud Infrastructure & DevOps Engineer",
    category: "DevOps",
    difficulty: "Intermediate",
    description: "Master Kubernetes, Docker, Terraform IaC, AWS services, and automated GitOps workflows.",
    imageUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?q=80&w=1000&auto=format&fit=crop",
    isPremium: true,
    estimatedHours: 100,
    steps: [
      { id: "do-1", title: "Linux Shell Scripting & Server Administration", description: "SSH, systemd, networking protocols, and Bash automation." },
      { id: "do-2", title: "Docker Containerization & Multi-Stage Builds", description: "Writing efficient Dockerfiles, network isolation, and compose stacks." },
      { id: "do-3", title: "Kubernetes Cluster Management & Helm", description: "Pods, Deployments, Ingress controllers, and stateful sets." },
      { id: "do-4", title: "Infrastructure as Code (Terraform & AWS)", description: "VPCs, ECS, RDS, IAM least-privilege security, and S3 buckets." },
      { id: "do-5", title: "GitOps, ArgoCD & Observability (Prometheus/Grafana)", description: "Zero-downtime blue/green rollouts and metrics dashboards." }
    ]
  },
  {
    id: "mobile-react-native",
    title: "Cross-Platform Mobile App Developer",
    category: "Mobile",
    difficulty: "Beginner",
    description: "Build iOS and Android applications with React Native, Expo, offline SQLite sync, and push notifications.",
    imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop",
    isPremium: false,
    estimatedHours: 80,
    steps: [
      { id: "rn-1", title: "React Native Core & Expo Setup", description: "Native components, styling with NativeWind, and device emulation." },
      { id: "rn-2", title: "Navigation & Deep Linking", description: "Expo Router, bottom tabs, stack navigation, and auth guards." },
      { id: "rn-3", title: "State Management & Offline Storage", description: "Zustand, React Query, and WatermelonDB/SQLite." },
      { id: "rn-4", title: "Native APIs: Camera, GPS, Biometrics & Notifications", description: "Push notifications, Apple FaceID, and device sensors." },
      { id: "rn-5", title: "App Store & Google Play Publishing", description: "Code signing, EAS build pipelines, and production release management." }
    ]
  },
  {
    id: "cybersecurity-analyst",
    title: "Cybersecurity & Ethical Hacking Track",
    category: "Security",
    difficulty: "Advanced",
    description: "Learn web application penetration testing, OWASP Top 10 mitigation, cryptography, and network defense.",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop",
    isPremium: true,
    estimatedHours: 110,
    steps: [
      { id: "sec-1", title: "Networking & Protocol Security (TCP/IP, TLS)", description: "Wireshark packet analysis, DNS security, and port scanning." },
      { id: "sec-2", title: "OWASP Top 10 Web Vulnerabilities & Remediation", description: "SQL Injection, XSS, CSRF, SSRF, and timing attacks." },
      { id: "sec-3", title: "Authentication, JWT Security & OAuth2 Protocols", description: "Cryptographic signing, token revocation, and session hijacking defense." },
      { id: "sec-4", title: "Penetration Testing Tools: Burp Suite & Nmap", description: "Intercepting proxies, fuzzing, and automated vulnerability scanning." },
      { id: "sec-5", title: "Cloud Security & IAM Hardening", description: "Zero-trust architecture, secrets management (Vault), and audit logging." }
    ]
  },
  {
    id: "uiux-product-design",
    title: "UI/UX & Product Design Specialist",
    category: "Design",
    difficulty: "Beginner",
    description: "Design intuitive digital products using Figma, design systems, usability research, and interactive prototyping.",
    imageUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=1000&auto=format&fit=crop",
    isPremium: false,
    estimatedHours: 65,
    steps: [
      { id: "ux-1", title: "User Research, Personas & Journey Mapping", description: "Qualitative interviews, user flow diagrams, and problem definitions." },
      { id: "ux-2", title: "Wireframing & Information Architecture", description: "Low-fidelity wireframes, visual hierarchy, and navigation schemes." },
      { id: "ux-3", title: "Figma Masterclass: Auto-Layout & Design Tokens", description: "Variants, components, color systems, and typography scales." },
      { id: "ux-4", title: "Interactive Prototyping & Micro-interactions", description: "Smart animate, state transitions, and component behaviors." },
      { id: "ux-5", title: "Design Handoff & Developer Collaboration", description: "Inspect mode, responsive specs, and design system documentation." }
    ]
  }
];

export const ROADMAPS = DEFAULT_NATIVE_ROADMAPS;

export function getRoadmapById(id: string): Roadmap | undefined {
  return DEFAULT_NATIVE_ROADMAPS.find(r => r.id === id);
}
