# Module 2 – Member Dashboard BFF Aggregator API

## Overview

Module 2 implements the **Backend-for-Frontend (BFF) Aggregator** for the A.N.X V1 Platform's Member Dashboard. It provides a single, unified API endpoint that fans out to multiple independent micro-services, aggregates their responses using `Promise.allSettled`, and returns a resilient composite payload to the frontend — even if one or more downstream services fail.

This module follows a **three-layer architecture**:

```
types/       →  TypeScript interfaces & response contracts
data/        →  In-memory data layer (mock/seed data + query helpers)
services/    →  Async service functions (Firestore-first with mock fallback)
```

The API routes that consume these layers live under:

```
src/app/api/v1/module2/dashboard/route.ts   →  GET  /api/v1/module2/dashboard
src/app/api/v1/module2/auth/route.ts        →  GET | POST  /api/v1/module2/auth
```

---

## Architecture

### BFF Aggregator Pattern

The dashboard route orchestrates **seven parallel service calls** and aggregates them into a single `DashboardResponse`:

```
Client Request
      │
      ▼
  Dashboard API Route  (/api/v1/module2/dashboard)
      │
      ├── userService.getUser()
      ├── membershipService.getMembership()
      ├── eventService.getUpcomingEvents()
      ├── eventService.getRegisteredEvents()
      ├── bookingService.getMentorBookings()
      ├── announcementService.getAnnouncements()
      └── projectService.getProjects()
      │
      ▼
  Promise.allSettled()  →  Resilient aggregation
      │
      ▼
  DashboardResponse JSON  (always returns 200, with trace metadata)
```

### Resilience Strategy

- All seven service calls are fired **concurrently** via `Promise.allSettled`.
- If a service rejects, the corresponding field in the response gracefully degrades to an empty object `{}` or empty array `[]`.
- A `meta.trace[]` array is included in every response, recording per-service status (`fulfilled` / `rejected`), execution duration (ms), and any error messages.

### Dual-Mode Data Source

Every service supports two modes controlled by the `?mock=true` query parameter:

| Mode | Trigger | Data Source |
|---|---|---|
| **Production** | `mock` is absent or `false` | Cloud Firestore via Firebase Admin SDK |
| **Mock / Dev** | `?mock=true` | In-memory TypeScript data arrays |

---

## Data Layer (`data/`)

The data layer provides seed data and query helper functions. It acts as the mock backend during development and as the fallback when Firestore is unavailable.

### Files

| File | Description |
|---|---|
| `users.ts` | 10 seeded `UserRecord` objects containing user profiles, membership details, progress metrics, and program progress arrays |
| `events.ts` | 10 upcoming `PlatformEvent` entries and `EventRegistration` join records mapping users to events |
| `projects.ts` | `UserProject` records assigned to individual users with task/review counts |
| `bookings.ts` | `UserBooking` records for mentor session reservations |
| `announcements.ts` | Global and user-targeted `UserAnnouncement` entries with priority levels |
| `index.ts` | Central query module exporting all lookup functions |

### Query Functions (`data/index.ts`)

| Function | Description |
|---|---|
| `getUserByIdOrEmail(identifier)` | Resolves a user by UID or email address (case-insensitive) |
| `getMembershipByUserId(userId)` | Returns membership info for a given user |
| `getProjectsByUserId(userId)` | Filters projects assigned to a user |
| `getBookingsByUserId(userId)` | Filters mentor bookings for a user |
| `getRegisteredEventsByUserId(userId)` | Returns events a user has registered for, with registration timestamps |
| `getUpcomingEventsList()` | Returns all upcoming platform events |
| `getAnnouncementsByUserId(userId)` | Returns global announcements + user-targeted announcements |
| `getAllUsers()` | Returns the full user list (for validation/admin views) |
| `getRecommendationsByUserId(userId)` | Generates role-based resource/mentor/course recommendations |

---

## Services Layer (`services/`)

Each service is an async function with a consistent signature:

```typescript
async function serviceName(
  userId: string,
  mock: boolean = false,    // use in-memory data instead of Firestore
  fail: boolean = false     // force a simulated failure for resilience testing
): Promise<T>
```

### Services

| File | Function | Returns |
|---|---|---|
| `userService.ts` | `getUser()` | `UserProfile` — name, email, role, progress |
| `membershipService.ts` | `getMembership()` | `MembershipInfo` — tier, status, expiry, upgrade CTA |
| `eventService.ts` | `getUpcomingEvents()` | `PlatformEvent[]` — global upcoming events |
| `eventService.ts` | `getRegisteredEvents()` | `PlatformEvent[]` — user's registered events |
| `bookingService.ts` | `getMentorBookings()` | `MentorBooking[]` — scheduled mentor sessions |
| `announcementService.ts` | `getAnnouncements()` | `Announcement[]` — global + user-targeted announcements |
| `projectService.ts` | `getProjects()` | `ProjectInfo[]` — projects the user is assigned to |

### Membership Enrichment Logic

The `membershipService` applies business rules after fetching raw data:

- **`isPremium`** — `true` when tier is `Premium` or `Enterprise` AND status is `active`
- **`upgradeCTA`** — dynamically generated call-to-action based on membership status:
  - `expired` → renewal prompt with formatted expiry date
  - `pending` → bank draft validation notice
  - `Basic` tier → upgrade prompt to Premium

---

## Type Definitions (`types/dashboard.ts`)

The `DashboardResponse` interface defines the strict API contract:

```typescript
interface DashboardResponse {
  user: UserProfile | {};
  membership: MembershipInfo | {};
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
```

### Key Interfaces

| Interface | Purpose |
|---|---|
| `UserProfile` | User identity, role, creation date, overall/program progress |
| `MembershipInfo` | Subscription tier, status, expiry, premium flag, upgrade CTA |
| `PlatformEvent` | Event details — title, date, location, description, registration timestamp |
| `MentorBooking` | Mentor session — mentor name, date/time, topic, status |
| `Announcement` | Platform notification — title, content, published date, priority level |
| `Recommendation` | Role-based suggestion — type (mentor/resource/course), title, description, link |
| `ProjectInfo` | Project assignment — title, description, status, role |

---

## API Endpoints

### `GET /api/v1/module2/dashboard`

Returns the aggregated dashboard payload for a given user.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `userId` | `string` | `default_user_123` | User ID or email (mock mode only) |
| `mock` | `boolean` | `false` | Use in-memory data instead of Firestore |
| `fail` | `string` | `""` | Comma-separated list of services to simulate failures for |

**Headers (production mode):**

| Header | Required | Description |
|---|---|---|
| `x-user-id` | Yes | Authenticated user ID (set by gateway/middleware) |

**`fail` parameter values:** `user`, `membership`, `events`, `upcomingevents`, `registeredevents`, `bookings`, `mentorbookings`, `announcements`, `projects`

**Example requests:**

```bash
# Mock mode — fetch dashboard for user "rohit@example.com"
GET /api/v1/module2/dashboard?mock=true&userId=rohit@example.com

# Mock mode — simulate failures in user and membership services
GET /api/v1/module2/dashboard?mock=true&userId=user_rohit&fail=user,membership

# Production mode (requires x-user-id header)
GET /api/v1/module2/dashboard
Headers: x-user-id: user_rohit
```

---

### `GET /api/v1/module2/auth`

Validates whether a user exists by email address.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | Yes | Email address to look up |

**Example:**
```bash
GET /api/v1/module2/auth?email=rohit@example.com
```

**Response (found):**
```json
{
  "exists": true,
  "user": { "id": "user_rohit", "name": "Rohit Palaram", "email": "rohit@example.com", "role": "Founder & Lead Architect" }
}
```

---

### `POST /api/v1/module2/auth`

Same lookup via POST body.

**Request Body:**
```json
{ "email": "rohit@example.com" }
```

---

## Seeded Test Users

The following users are available for testing in mock mode:

| User ID | Name | Role | Tier | Status |
|---|---|---|---|---|
| `user_rohit` | Rohit Palaram | Founder & Lead Architect | Enterprise | Active |
| `user_jane` | Jane Doe | Lead Backend Developer | Premium | Active |
| `user_alex` | Alex Smith | Frontend UI Engineer | Basic | Active |
| `user_emma` | Emma Watson | Data Analyst | Basic | **Expired** |
| `user_david` | David Miller | Full Stack Apprentice | Premium | Active |
| `user_sophia` | Sophia Chen | UI/UX Designer | Premium | Active |
| `user_liam` | Liam Johnson | Mobile App Developer | Basic | **Pending** |
| `user_olivia` | Olivia Taylor | Cloud Architect | Enterprise | Active |
| `user_noah` | Noah Brown | DevOps Engineer | Basic | Active |
| `user_isabella` | Isabella Garcia | Product Manager | Premium | Active |

---

## Directory Structure

```
src/modules/module2/
├── data/
│   ├── index.ts            # Central query module with all lookup functions
│   ├── users.ts            # 10 seeded user records with profiles & memberships
│   ├── events.ts           # 10 platform events + user-event registration join data
│   ├── projects.ts         # User-assigned project records
│   ├── bookings.ts         # Mentor session booking records
│   └── announcements.ts    # Global and user-targeted announcements
├── services/
│   ├── userService.ts      # Fetches user profile (Firestore or mock)
│   ├── membershipService.ts# Fetches & enriches membership data
│   ├── eventService.ts     # Fetches upcoming & registered events
│   ├── bookingService.ts   # Fetches mentor bookings
│   ├── announcementService.ts # Fetches announcements (global + targeted)
│   └── projectService.ts   # Fetches assigned projects
├── types/
│   └── dashboard.ts        # TypeScript interfaces & DashboardResponse contract
└── README.md               # This file

src/app/api/v1/module2/
├── dashboard/
│   └── route.ts            # GET — BFF aggregator dashboard endpoint
└── auth/
    └── route.ts            # GET | POST — user authentication lookup
```

---

## Key Design Decisions

1. **`Promise.allSettled` over `Promise.all`** — ensures the API never returns a 500 due to a single service failure; partial data is always returned.
2. **Instrumented tracing** — every service call is wrapped in an `instrument()` helper that measures latency and records pass/fail status in `meta.trace[]`.
3. **Identity resolution** — the dashboard API accepts both user IDs and email addresses; emails are resolved to UIDs before querying.
4. **Simulated failure injection** — the `?fail=` parameter allows resilience testing without modifying code.
5. **Security gate** — in production mode (Firestore enabled), the API requires the `x-user-id` header and rejects unauthenticated requests with a 401.
6. **Graceful degradation** — failed object services return `{}`, failed array services return `[]`, ensuring the frontend always receives a valid `DashboardResponse` shape.

---

## How to Test

```bash
# Start the dev server
npm run dev

# Test with mock data
curl http://localhost:3000/api/v1/module2/dashboard?mock=true&userId=user_rohit

# Test resilience — simulate user service failure
curl http://localhost:3000/api/v1/module2/dashboard?mock=true&userId=user_rohit&fail=user

# Test all services failing
curl http://localhost:3000/api/v1/module2/dashboard?mock=true&userId=user_rohit&fail=user,membership,events,bookings,announcements,projects

# Test auth lookup
curl http://localhost:3000/api/v1/module2/auth?email=rohit@example.com
```
