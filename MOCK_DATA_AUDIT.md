# ANX CLUB — Mock Data Audit & Removal Plan

**Module Focus:** Admin Event Management, Event Registrations, Event Reports, Event-Related Admin Dashboard, and College Information  
**Date:** October 30, 2026  
**Auditor:** Senior Full-Stack Developer  

---

## 1. Executive Summary

This audit identifies all hardcoded mock arrays, in-memory stores, simulated API responses, fake fallbacks, and dummy statistics within the assigned event and college modules of the ANX Club platform.

Prior to this audit, multiple core event workflows relied on silent fallbacks: when Firebase Firestore operations were unavailable or returned empty results, the system silently substituted hardcoded mock records (`MOCK_EVENTS`, `memoryStore`), displaying dummy events and fake attendee registrations as if they were genuine database records.

This document inventories every mock data source across the assigned scope, details its operational impact, specifies the required real backend data source, and defines the remediation strategy to establish genuine database persistence, strict authorization, and complete UI state handling (Loading, Empty, Error, and Success).

---

## 2. Inventory of Identified Mock Data Sources

### Item 1: Static Mock Events Catalog (`MOCK_EVENTS`)
- **File Path:** `src/lib/constants.ts` (Lines 82–160)
- **What Mock Data Exists:** A static array of 6 hardcoded events (`evt-1` to `evt-6`) containing fake titles (*React 19 Deep Dive*, *AI/ML Hackathon 2026*, etc.), dummy capacities, fake registered counts (`registeredCount: 57`), and dummy Unsplash images.
- **How It Is Currently Used:** Exported and imported across multiple UI pages (`/admin/events`, `/events`, `/events/[id]`, `/admin`) and API routes (`/api/v1/events`, `/api/v1/events/[id]`, `/api/v1/events/[id]/register`) as a universal fallback.
- **Affects Production UI:** **Yes**. Any time Firestore is unreachable or returns an empty collection, the production UI displays these 6 sample events.
- **Required Real Data Source:** Cloud Firestore `events` collection (`adminDb.collection('events')`).
- **Recommended Changes:** Decouple production pages and API routes from `MOCK_EVENTS`. Retain the constant strictly for test fixtures or local development seed scripts (`/api/v1/admin/seed`).
- **Dependencies & Impact:** Teammate Sai Teja's Student Dashboard (`/dashboard/page.tsx`) also references this constant; coordination required to ensure dashboard feeds handle empty arrays gracefully.

---

### Item 2: Global In-Memory Event & Registration Store (`memoryStore`)
- **File Path:** `src/lib/memory-store.ts` (Lines 105–240, 245–300)
- **What Mock Data Exists:** 
  1. `globalThis.__ANX_MEMORY_STORE__.events` initialized with `[...(MOCK_EVENTS)]`.
  2. `globalThis.__ANX_MEMORY_STORE__.registrations` seeded with dummy attendee records:
     - `reg-evt-1-1`: Rohit Verma (`rohit.v@example.com`, `usr_rohit`)
     - `reg-evt-1-2`: Priya Sharma (`priya.s@example.com`, `usr_priya`)
  3. Getter/setter methods (`getMemoryEvents`, `findMemoryEvent`, `addMemoryEvent`, `getMemoryRegistrations`, `addMemoryRegistration`) mimicking a persistent database in Node.js server memory.
- **How It Is Currently Used:** API route handlers merge in-memory arrays with Firestore queries or fall back to them when Firestore throws errors.
- **Affects Production UI:** **Yes**. Event registrations modal on `/admin/events` shows fake attendees (`Rohit Verma`, `Priya Sharma`) for events with 0 real registrations.
- **Required Real Data Source:** Cloud Firestore `events` and `eventRegistrations` collections.
- **Recommended Changes:** Remove in-memory store fallbacks from event and registration route handlers. Return actual database results or explicit error statuses (500/503).
- **Dependencies & Impact:** Used by mentoring and resume review routes (`src/app/api/career/resume-review/route.ts`); changes must be strictly isolated to event-related functions.

---

### Item 3: Silent Mock Fallback in Public & Admin Events List API
- **File Path:** `src/app/api/v1/events/route.ts` (Lines 19–44, 90–98, 126–130, 194–198)
- **What Mock Data Exists:**
  - Lines 30–35: Merges Firestore events with `getMemoryEvents()`.
  - Lines 36–39: Catches Firestore errors and returns `[...getMemoryEvents()]` with status 200.
  - Lines 41–43: If Firestore query returns 0 events (`events.length === 0`), automatically injects `[...getMemoryEvents()]`.
  - Lines 92–96: Global catch block returns HTTP 200 with `data: fallbackEvents`.
  - Lines 126–130: In POST handler, unauthenticated requests are assigned `userId = "admin_user"` and `isAdmin = true`.
  - Lines 194–198: Falls back to `addMemoryEvent()` and returns HTTP 201 when Firestore save fails.
- **How It Is Currently Used:** Serves all event listing requests for both the student catalog (`/events`) and admin console (`/admin/events`).
- **Affects Production UI:** **Yes**. An empty database cannot be viewed because sample events are automatically injected. Database failures are silently converted into success responses.
- **Required Real Data Source:** Cloud Firestore `events` collection (`isActive != false`).
- **Recommended Changes:**
  - Return only actual Firestore documents.
  - Return empty array `[]` when collection is empty.
  - Return HTTP 500/503 on database connection failure.
  - Enforce authentication on POST handler; reject unauthenticated creation attempts with 401.
- **Dependencies & Impact:** Direct consumer is `/events` and `/admin/events`. Both pages must handle empty arrays and error responses properly.

---

### Item 4: Single Event Detail Fallback
- **File Path:** `src/app/api/v1/events/[id]/route.ts` (Lines 31–46)
- **What Mock Data Exists:** When an event ID is not found in Firestore, the handler checks `findMemoryEvent(id)` and `MOCK_EVENTS.find(e => e.id === id)`.
- **How It Is Currently Used:** Serves `/api/v1/events/[id]`.
- **Affects Production UI:** **Yes**. Direct navigation to `/events/evt-1` displays mock data even though no such record exists in Firestore.
- **Required Real Data Source:** Cloud Firestore `events` document by ID.
- **Recommended Changes:** Remove mock fallbacks. Return HTTP 404 `{ success: false, message: "Event not found" }` if document does not exist in Firestore.
- **Dependencies & Impact:** Consumed by `src/app/(dashboard)/events/[id]/page.tsx`.

---

### Item 5: Unprotected Admin Registrations API with Mock Attendee Fallback
- **File Path:** `src/app/api/v1/admin/events/[id]/registrations/route.ts` (Lines 7–43)
- **What Mock Data Exists:**
  - Has zero authentication or role checks.
  - Lines 24–28: Merges database registrations with `getMemoryRegistrations(params.id)`.
  - Lines 30–32: Catches Firestore errors and returns in-memory dummy registrations.
  - Lines 34–36: If 0 registrations found, injects dummy registrations (`Rohit Verma`, `Priya Sharma`).
  - Lines 40–42: Catch block returns HTTP 200 with mock registrations.
- **How It Is Currently Used:** Powers the "View Registrations" modal on `/admin/events`.
- **Affects Production UI:** **Yes**. Shows fake attendee names, phones, and emails for any event.
- **Required Real Data Source:** Cloud Firestore `eventRegistrations` collection filtered by `where('eventId', '==', params.id)`.
- **Recommended Changes:**
  - Add Admin authentication verification (`verifyAuthToken` + Admin role check).
  - Query only Firestore `eventRegistrations`.
  - Return empty array `[]` when no attendees have registered.
  - Return HTTP 500 on database failure; never return dummy attendees.
- **Dependencies & Impact:** Consumed exclusively by `src/app/(admin)/admin/events/page.tsx`.

---

### Item 6: Registration Endpoint Mock Event Injection & In-Memory Fallback
- **File Path:** `src/app/api/v1/events/[id]/register/route.ts` (Lines 13, 26–28, 106–118, 140–164)
- **What Mock Data Exists:**
  - Line 13: Falls back to dummy user `'default_user_123'` when unauthenticated.
  - Lines 26–28: Uses `MOCK_EVENTS` when event is missing in Firestore.
  - Lines 106–118: If event does not exist in Firestore during registration, auto-initializes the mock event into Firestore.
  - Lines 140–164: Saves registration into `memoryStore.registrations` and updates memory event seats, masking database write failures.
- **How It Is Currently Used:** Processes event registration submissions.
- **Affects Production UI:** **Yes**. Users can register for phantom events and receive fake confirmations even if database write fails.
- **Required Real Data Source:** Real authenticated user ID via Firebase Auth token and real Firestore transaction on `events` and `eventRegistrations`.
- **Recommended Changes:**
  - Require valid authentication (`authUserId`); return 401 Unauthorized if missing.
  - Verify event exists in Firestore; return 404 if not found.
  - Remove all in-memory store writes and mock event synthesis.
  - Ensure transaction failure returns HTTP 500 with descriptive error.
- **Dependencies & Impact:** Consumed by `PaidEventCheckoutModal.tsx` and event detail registration buttons.

---

### Item 7: Silent Mock Fallback in Admin Events UI
- **File Path:** `src/app/(admin)/admin/events/page.tsx` (Lines 30–36)
- **What Mock Data Exists:** `setEvents(MOCK_EVENTS)` executed inside the `else` and `catch` blocks of `fetchEvents`.
- **How It Is Currently Used:** Populates the event management table.
- **Affects Production UI:** **Yes**. Masking backend errors by rendering sample events instead of notifying the administrator.
- **Required Real Data Source:** `GET /api/v1/events` returning actual Firestore events.
- **Recommended Changes:**
  - Remove `MOCK_EVENTS` fallback.
  - Implement explicit `loading`, `error`, and `empty` states.
  - Add a "Retry" button on error.
  - If array is empty, render a clear "No events found" empty state with a "Create New Event" button.
- **Dependencies & Impact:** Isolated to the Admin Event Management UI.

---

### Item 8: Admin Event Creation Mock Admin Token
- **File Path:** `src/app/(admin)/admin/events/create/page.tsx` (Lines 57, 65)
- **What Mock Data Exists:** Falls back to `'mock_admin_token'` when no session token is detected in `localStorage`.
- **How It Is Currently Used:** Authorization header in `POST /api/v1/events`.
- **Affects Production UI:** **Yes**. Masks unauthenticated admin states.
- **Required Real Data Source:** Authenticated Firebase ID token from `useAuth()` (`user.getIdToken()`).
- **Recommended Changes:**
  - Require genuine authenticated token. If absent, redirect to `/admin/login` or display error.
  - Add College selector integrating with `COLLEGES_BY_STATE` from `src/lib/data/colleges.ts`.
- **Dependencies & Impact:** Isolated to event creation form.

---

### Item 9: Hardcoded Admin Dashboard Ticker & KPI Fallbacks
- **File Path:** `src/app/(admin)/admin/page.tsx` (Lines 13–19, 47–51, 248–280)
- **What Mock Data Exists:**
  - Lines 13–19: `recentActivities` array with fake user actions (*Arjun Sharma*, *Priya Nambiar*, *Rohan Mehta*, *Amit Sen*, *Sneha Roy*).
  - Lines 47–51: Hardcoded fallback metrics: `totalUsers: 2482`, `premiumUsers: 1164`, `totalEvents: 18`, `totalResources: 12`.
  - Lines 248–280: Hardcoded "Cohort Segment Breakdown" (*IIT Madras Core: 48%*, *Active Mentor Bookings: 76%*, *Course Completions: 32%*).
- **How It Is Currently Used:** Displays core statistics on the main Admin Dashboard overview (`/admin`).
- **Affects Production UI:** **Yes**. Admins see fabricated activity feeds and synthetic user numbers if analytics endpoint fails.
- **Required Real Data Source:** `GET /api/v1/admin/analytics` backed by actual Firestore counts.
- **Recommended Changes:**
  - Remove hardcoded default metrics; display real API figures or 0 with loading/error indicators.
  - Replace static activity ticker with real recent event registrations/signups or clean empty state ("No recent activity").
  - Dynamically compute or cleanly present cohort metrics based on actual user database records.
- **Dependencies & Impact:** Admin home page only.

---

### Item 10: Fake Top Events and Statistics in Analytics API
- **File Path:** `src/app/api/v1/admin/analytics/route.ts` (Lines 105–121)
- **What Mock Data Exists:** Catch block returns synthetic analytics:
  ```json
  {
    "totalUsers": 24, "premiumUsers": 8, "totalEvents": 6,
    "totalResources": 12, "totalRoadmaps": 10, "mam": 18, "mrr": 7992,
    "topEvents": [
      { "id": "1", "title": "Next.js 16 Production Masterclass", "registeredCount": 45 },
      { "id": "2", "title": "AI Agent Workflows with LangChain", "registeredCount": 38 },
      { "id": "3", "title": "Cloud DevOps & Docker Bootcamp", "registeredCount": 29 }
    ]
  }
  ```
- **How It Is Currently Used:** Fallback when Firestore query fails.
- **Affects Production UI:** **Yes**. Admin Dashboard charts and top events tables populate with fictional events.
- **Required Real Data Source:** Firestore aggregation across `users`, `events`, and `eventRegistrations`.
- **Recommended Changes:**
  - Remove fake fallback data.
  - Return HTTP 500/503 `{ success: false, error: "Database unavailable" }` on failure so the client displays an error state with retry.
- **Dependencies & Impact:** Consumed by `/admin` and `/admin/analytics`.

---

### Item 11: Silent Mock Fallback in Student Events Discovery Catalog
- **File Path:** `src/app/(dashboard)/events/page.tsx` (Lines 191–198, 296)
- **What Mock Data Exists:**
  - Lines 191–198: Sets `setEvents(MOCK_EVENTS)` on fetch failure.
  - Line 296: In `filteredEvents`, executes `(events.length > 0 ? events : MOCK_EVENTS)`, forcing mock events whenever Firestore is empty.
- **How It Is Currently Used:** Student Event Catalog.
- **Affects Production UI:** **Yes**. Students are never shown an empty event catalog; mock events appear permanently when database is empty.
- **Required Real Data Source:** Actual published events from `/api/v1/events`.
- **Recommended Changes:**
  - Remove all fallbacks to `MOCK_EVENTS`.
  - Add explicit Loading skeleton, Error state with "Try Again", and Empty state ("No events scheduled yet").
  - Include college filtering using `COLLEGES_BY_STATE`.
- **Dependencies & Impact:** Student event discovery page.

---

### Item 12: Client-Side Fake Cancellation in Event Detail View
- **File Path:** `src/app/(dashboard)/events/[id]/page.tsx` (Lines 105–109)
- **What Mock Data Exists:** "Cancel Registration" handler simply calls `setRegisteredList(p => p.filter(id => id !== event.id))` and displays a success toast without issuing an API request to Firestore.
- **How It Is Currently Used:** Event detail page cancellation button.
- **Affects Production UI:** **Yes**. Fakes cancellation locally while database registration remains active.
- **Required Real Data Source:** Backend endpoint for registration cancellation (or explicit disabled state if cancellation is not supported).
- **Recommended Changes:** Disallow silent client-side cancellation; connect to real cancellation endpoint or indicate that cancellations must be processed via admin/support.
- **Dependencies & Impact:** Student event detail view.

---

### Item 13: Simulated Payment Bypass in Paid Event Checkout Modal
- **File Path:** `src/components/events/PaidEventCheckoutModal.tsx` (Lines 42–85, 88–91)
- **What Mock Data Exists:** `handleSimulatedPayment` generates simulated IDs (`pay_sim_...`, `order_sim_...`) and registers users as "paid" directly when `NEXT_PUBLIC_RAZORPAY_KEY_ID` is missing.
- **How It Is Currently Used:** Paid event registration checkout modal.
- **Affects Production UI:** **Yes**. Allows registering for paid events without real payment.
- **Required Real Data Source:** Verified Razorpay order creation and webhook/signature verification.
- **Recommended Changes:** Prevent silent simulated paid registrations. If Razorpay keys are not configured, display an explicit banner indicating payment gateway is in test mode and do not record unverified payments as genuine completed transactions without admin authorization.
- **Dependencies & Impact:** Teammate responsible for Razorpay/payments; coordination required.

---

### Item 14: College Information Disconnection
- **File Path:** `src/lib/data/colleges.ts`
- **What Mock Data Exists:** Comprehensive state-by-state record of real Indian institutions (`COLLEGES_BY_STATE`), but completely disconnected from event management.
- **How It Is Currently Used:** Used only in user profile / signup forms; not utilized in events.
- **Affects Production UI:** **Yes**. Events lack college attribution and students cannot filter events by college.
- **Required Real Data Source:** `COLLEGES_BY_STATE` imported into event creation and event discovery.
- **Recommended Changes:**
  - Add college dropdown to Admin event creation form (`src/app/(admin)/admin/events/create/page.tsx`).
  - Persist `collegeName` and `collegeId` on event records in Firestore.
  - Add college filter to student event catalog (`src/app/(dashboard)/events/page.tsx`).
- **Dependencies & Impact:** Event model extension (`src/types/index.ts`).

---

## 3. Remediation Matrix & Action Plan

| Component | Target File | Action Required | Status |
| :--- | :--- | :--- | :--- |
| **Admin Events API** | `src/app/api/v1/admin/events/[id]/registrations/route.ts` | Locked down with Admin auth. Removed `getMemoryRegistrations` and all mock fallbacks. Returns genuine Firestore attendees or `[]` (HTTP 200). Returns 503 on database failure. | **Completed** |
| **Public Events API** | `src/app/api/v1/events/route.ts` | Removed `getMemoryEvents` / `addMemoryEvent`. Returns real Firestore records or `[]`. Returns 503 on failure. Enforces auth on POST with college and registration type attributes. | **Completed** |
| **Event Detail API** | `src/app/api/v1/events/[id]/route.ts` | Removed `findMemoryEvent` and `MOCK_EVENTS` fallback. Returns 404 if not found or 503 on database error. | **Completed** |
| **Registration API** | `src/app/api/v1/events/[id]/register/route.ts` | Requires authenticated user (rejects with 401). Checks for external registration events (returns 400 with external URL). Removed memory store writes and mock event synthesis. | **Completed** |
| **Analytics API** | `src/app/api/v1/admin/analytics/route.ts` | Removed hardcoded `topEvents` and fake metrics fallback (`totalEvents: 6`). Returns genuine counts or 503 error. | **Completed** |
| **Admin Events Page** | `src/app/(admin)/admin/events/page.tsx` | Removed `MOCK_EVENTS` fallback. Added Loading skeleton, Empty state with "Create Event", and Error state with "Retry". Displays real campus/college details. | **Completed** |
| **Admin Event Creation** | `src/app/(admin)/admin/events/create/page.tsx` | Removed `'mock_admin_token'`. Integrated `COLLEGES_BY_STATE` into campus selector. Added Registration Channel selector (Internal ANX Pass vs External Link). | **Completed** |
| **Admin Overview Page** | `src/app/(admin)/admin/page.tsx` | Removed fake activity ticker and fallback metrics (`2482`, `1164`, `18`, `12`). Displays real counts, dynamic cohort breakdown, error banner with retry, and empty activity state. | **Completed** |
| **Student Events Page** | `src/app/(dashboard)/events/page.tsx` | Removed `MOCK_EVENTS` fallback. Added Loading skeleton, Empty database state, Filtered empty state with reset, Error state with retry, and College filter via `COLLEGES_BY_STATE`. | **Completed** |
| **Event Detail Page** | `src/app/(dashboard)/events/[id]/page.tsx` | Removed `MOCK_EVENTS` import. Removed client-side fake cancellation. Added campus display and support for external event portal links. | **Completed** |
| **Paid Checkout Modal**| `src/components/events/PaidEventCheckoutModal.tsx` | Removed `handleSimulatedPayment` bypass. Requires real `getAuthToken` and authentic Razorpay payment verification. Displays clear notice when gateway keys are missing. | **Completed** |
| **Types Contract** | `src/types/index.ts` | Added `collegeId`, `collegeName`, `registrationType`, `externalRegistrationUrl`, and declared `EventRegistration` / `EventReport` interfaces. | **Completed** |

---

## 4. Teammate Coordination & Blockers

1. **Environmental Blocker (GCP Project Database Mode):**
   - As documented in the Admin Credentials Audit, the remote GCP project `anx-club` has Firestore in Native Mode disabled on its `"default"` database, causing status `5 NOT_FOUND`.
   - **Remediation Handling:** When Firestore returns `5 NOT_FOUND`, the application must display a proper **Error State** ("Database service temporarily unavailable. Please retry shortly.") with a retry button, rather than silently injecting mock data.
2. **Payment Module Coordination (Teammate Sai Ram / Razorpay):**
   - Coordinate on paid event checkout to avoid duplicate registrations between `/api/v1/payments/verify` and `/api/v1/events/[id]/register`.
3. **Student Dashboard Feed Coordination (Teammate Sai Teja):**
   - Coordinate to ensure that when `MOCK_EVENTS` is removed, the Student Dashboard gracefully displays an empty state for upcoming events rather than crashing.
