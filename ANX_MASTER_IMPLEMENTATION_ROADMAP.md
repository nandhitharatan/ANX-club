# ANX CLUB — MASTER IMPLEMENTATION ROADMAP & TEAM ARCHITECTURE SPECIFICATION

**Platform:** ANX Club — Alliance for NextGen Excellence  
**Organization:** AlgorithmAliens Private Limited  
**Contributors & Roles:**
* **Nandhitha (Me):** Admin Event Management, Student Head Dashboard, Student Head Event Management, Member Management, Event Registrations, Event Reports, Announcements & Notifications, Tasks, Assignments & Challenges, Testing & Integration
* **Sai Teja (Teja):** Student Dashboard, Student Profile & Activities, Event Discovery & Registration UI, Projects & Portfolios, Gamification (XP/Badges/Certificates), Mentor Dashboard, Mentoring Requests & Decisions, Real Google Meet & Calendar Engine
* **Sandesh:** Authentication Infrastructure, NextAuth / Firebase Auth Login & Signup, Admin Auth Gate, College Master Entity Management (`colleges` collection), Student Head Appointments & Mentor Account Provisioning
* **Sri Nidhi:** Razorpay Payment Gateway Integration, Payment Orders, Payment Verification, Webhook Processing, Payment Records, Membership Plans & Subscriptions, Membership Activation
**Deliverable File:** `ANX_MASTER_IMPLEMENTATION_ROADMAP.md`  
**Companion File:** `INTERNSHIP_WORK_LOG.md`  
**Document Status:** Master Prioritized Roadmap & Dependency Specification (No Source Code Modifications During Planning Phase)  
**Date:** November 2026  

---

## 1. Project Overview & Team Ownership Boundaries

ANX Club is an enterprise multi-college community and professional growth platform connecting students, mentors, and college club chapters under a centralized management structure operated by AlgorithmAliens Private Limited.

To ensure rapid delivery, zero merge conflicts, and architectural clarity, project responsibilities are divided into four strict ownership domains:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ANX CLUB TEAM RESPONSIBILITY MATRIX                                   │
├───────────────────────────────┬───────────────────────────────┬─────────────────────────────────────────┤
│ Contributor                   │ Primary Domain Scope          │ Implementation & Governance Boundary    │
├───────────────────────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ **NANDHITHA (Me)**            │ • Admin Event Management       │ Full ownership of event lifecycle,      │
│                               │ • Student Head Dashboard      │ Student Head workspace, event reports,  │
│                               │ • Student Head Event Mgmt     │ college-level member directory, tasks,  │
│                               │ • Member Management           │ announcements, and registration engine. │
│                               │ • Event Registrations         │ Consumes Sandesh's auth/colleges and    │
│                               │ • Event Reports Pipeline      │ Sri Nidhi's payment verification.       │
│                               │ • Announcements & Notifs      │                                         │
│                               │ • Tasks, Assignments & Contests│                                         │
├───────────────────────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ **SAI TEJA (Teja)**           │ • Student Dashboard Overview  │ Full ownership of student hub, user     │
│                               │ • Student Profile & Activities│ portfolio, gamification ledger, mentor  │
│                               │ • Event Discovery & Reg UI    │ portal, session scheduling, and Google  │
│                               │ • Projects & Portfolios       │ Meet / Calendar conference generation.  │
│                               │ • XP, Badges & Certificates   │ Consumes Nandhitha's event endpoints    │
│                               │ • Mentor Dashboard Portal     │ and Sri Nidhi's membership tier state.  │
│                               │ • Mentoring Requests & Decisions│                                       │
│                               │ • Google Calendar & Meet Sync │                                         │
├───────────────────────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ **SANDESH**                   │ • Authentication Infra        │ **External Dependency Boundary**:       │
│ *(Excluded from our tasks)*   │ • Login & Signup Flow         │ Nandhitha and Teja must NEVER modify,   │
│                               │ • Auth Provider Config        │ refactor, or fix Sandesh's code. His   │
│                               │ • Admin Authentication Gate   │ modules provide authenticated tokens,   │
│                               │ • College Master Management   │ user role claims, and the `colleges`    │
│                               │ • Student Head Appointments   │ collection consumed via strict APIs.    │
├───────────────────────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ **SRI NIDHI**                 │ • Razorpay Gateway Integration│ **External Dependency Boundary**:       │
│ *(Excluded from our tasks)*   │ • Payment Order Creation      │ Nandhitha and Teja must NEVER modify,   │
│                               │ • Payment Signature Verify    │ refactor, or fix Sri Nidhi's code. Her  │
│                               │ • Payment Webhooks Processing │ modules provide verified payment IDs,   │
│                               │ • Payment Records Collection  │ `memberships` records, and pricing APIs.│
│                               │ • Membership Plans & Pricing  │ We integrate via agreed contracts.      │
│                               │ • Membership Activation       │                                         │
└───────────────────────────────┴───────────────────────────────┴─────────────────────────────────────────┘
```

### Strict Rules of Engagement:
1. **Zero Interference with Excluded Modules:** Neither Nandhitha nor Sai Teja will modify, rewrite, or commit code to Sandesh's authentication/college-management files or Sri Nidhi's Razorpay/membership-management files.
2. **Interface-Driven Integration:** We interact with Sandesh and Sri Nidhi strictly through published data schemas, database collections, and API contracts.
3. **Unified Execution Sequence:** Because Nandhitha and Sai Teja share closely coupled domains (Events, Student Dashboard, Registrations, Mentoring), our tasks are unified into a single, dependency-aware implementation sequence.

---

## 2. Verification of Prior Work & Existing Codebase Gaps

### 2.1 Verification Audit of the 9 Previously Reported Features

A rigorous code audit was conducted against actual repository files, running tests, and UI routes:

| # | Feature Claim | Actual Status | Code Evidence & Verification Finding |
|---|---|---|---|
| **1** | Removal of mock event data | ⚠️ **Incomplete** | `/api/v1/events` now queries Firestore and returns HTTP 503 on error. However, `MOCK_EVENTS` remains in `src/lib/constants.ts` and is actively used as a fallback in Sai Teja's Student Dashboard (`src/app/(dashboard)/dashboard/page.tsx` line 98) and `src/modules/module2/services/eventService.ts`. |
| **2** | Removal of in-memory registration fallbacks | ⚠️ **Incomplete** | Event registration in `/api/v1/events/[id]/register` now requires Firestore. However, `src/lib/memory-store.ts` still holds mock registrations, and mentor bookings (`/api/v1/mentors/[id]/book`) still call `addMemoryBooking()`. |
| **3** | Admin event creation form | ✅ **Verified Complete** | `src/app/(admin)/admin/events/create/page.tsx` implements 25+ fields, live preview, dynamic agenda slots, deadline validation, and speaker profiles. Persists to Firestore `events` collection via `POST /api/v1/events`. Missing: Dynamic backend college list (currently uses static `COLLEGES_BY_STATE`). |
| **4** | Event lifecycle implementation | ✅ **Verified Complete** | Canonical 4-state state machine implemented in `src/lib/events/lifecycle.ts` and `src/app/api/v1/events/[id]/lifecycle/route.ts` (`Draft`, `Published`, `Cancelled`, `Deleted`). |
| **5** | Draft and published states | ✅ **Verified Complete** | Public discovery endpoint filters out `Draft` and `Deleted` events for non-admins. `/admin/events` displays status tabs and publish/unpublish toggle controls. |
| **6** | Cancellation with mandatory reasons | ✅ **Verified Complete** | Modal enforces non-empty cancellation reason (min 3 chars). Reason and timestamp are saved to Firestore and returned to clients. |
| **7** | Soft deletion and archival | ✅ **Verified Complete** | `DELETE /api/v1/events/[id]` sets `isActive: false` and `status: "Deleted"`, safely preserving historical registrations, attendee rosters, and financial audit records. |
| **8** | Registration restrictions on inactive events | ✅ **Verified Complete** | Atomic Firestore transactions check lifecycle status and block registration with HTTP 400 for `Cancelled` and `Draft` events. |
| **9** | Event validation and related tests | ✅ **Verified Complete** | `__tests__/api/admin-events-lifecycle.test.ts` has 18 Jest test cases covering state normalization, validation, auth gates, cancellation reasons, and registration blocking. **All 18 tests pass**. |

### 2.2 Critical Bugs & Incomplete Work Discovered

1. **Missing Admin Event Edit UI:** `PUT /api/v1/events/[id]` is implemented on the backend, but **zero UI exists**. There is no `/admin/events/[id]/edit` page, and `/admin/events/page.tsx` has no "Edit" action button.
2. **Paid Event Double-Registration Bug:** In `src/components/events/PaidEventCheckoutModal.tsx`, when Razorpay succeeds, the modal calls `verifyRazorpayPayment()` (which already creates an `eventRegistrations` record and increments seats in `src/app/api/v1/payments/verify/route.ts`) and then immediately calls `POST /api/v1/events/[id]/register`, creating duplicate registrations and double-incrementing seat counts.
3. **Fake Client-Side Cancellation:** In `src/app/(dashboard)/events/page.tsx` (lines 323–328), clicking "Cancel Registration" merely executes `setRegisteredList(p => p.filter(id => id !== eventId))` and toasts success without calling any backend API.
4. **External Link Fallback Vulnerability:** If `registrationType === 'external'` but `externalRegistrationUrl` is empty, both `events/page.tsx` and `events/[id]/page.tsx` fall through to render an active internal registration button, violating the rule that Student Head events must never use internal registration.
5. **Completely Missing Modules (0% Implemented):**
   * *Student Head Workspace:* No routes, no UI, and `'Student Head'` is missing from `AuthContext.tsx`.
   * *Event Reports Workflow:* Only the `EventReport` TypeScript interface exists in `src/types/index.ts`. No APIs, submission forms, or review portals exist.
   * *Tasks, Assignments & Challenges:* No models, APIs, or UI exist for creating tasks or student submissions.
   * *Mentor Dashboard & Real Meet Integration:* No mentor portal exists. Booking generates a fake URL (`https://meet.google.com/anx-...`) and falls back to Jitsi (`https://meet.jit.si/...`), violating explicit system requirements.

---

## 3. Firebase Blocker Analysis & Governance

### 3.1 Blocker Root Cause
* **Project:** `anx-club` | **Region:** `nam5` | **Database:** `default` | **Edition:** Enterprise
* **Access Mode:** Native mode disabled; MongoDB-compatible mode enabled.
* **Error:** Querying Firestore via Firebase Admin SDK throws `Error: 9 FAILED_PRECONDITION: DATA_ACCESS_MODE_DISABLED: Native mode is disabled`.

### 3.2 Operating Boundaries Under Blocker
* **Strict Prohibitions:** Do not create or delete databases; do not alter Firebase credentials; do not re-introduce mock persistence; do not return fake success responses when database operations fail.
* **Feasibility Division:**
  * **What CAN Proceed Now:** Full UI page and component development, App Router API route handlers, Zod validation schemas, state machine logic, TypeScript interfaces, security rules definitions, and Jest unit/integration test suites using mocked SDKs.
  * **What REQUIRES Live Database Resolution (Post-Unblock):** Live database smoke testing, multi-user concurrency testing, seed scripts, and Firebase Console security rule deployment.

---

## 4. Master Unified Implementation Roadmap (Nandhitha & Sai Teja)

Tasks are sequenced into 7 logical phases respecting technical prerequisites. Every task indicates its **Owner**, **Dependency Type** (Independent vs. Teammate Integration), **Acceptance Criteria**, and **Blocker Status**.

---

### PHASE 1: Shared Foundation, Contracts & Data Isolation (Sprint 1)
*Focus: Establish security boundaries, role definitions, and eliminate silent mock fallbacks.*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1 TASK MATRIX                                                                                                    │
├───────┬──────────────────────────────────┬──────────────┬──────────┬──────────┬──────────────────────┬─────────────────┤
│ ID    │ Task Name                        │ Owner        │ Priority │ Mode     │ Teammate Dependency  │ Blocker Status  │
├───────┼──────────────────────────────────┼──────────────┼──────────┼──────────┼──────────────────────┼─────────────────┤
│ T-1.1 │ Role & UserProfile Harmonization │ Joint        │ P0       │ Joint    │ Sandesh (Auth Roles) │ Can Implement   │
│ T-1.2 │ College Data Contract Interface  │ Nandhitha    │ P0       │ External │ Sandesh (Colleges)   │ Can Implement   │
│ T-1.3 │ Student Head Auth Guard          │ Nandhitha    │ P0       │ Indep.   │ T-1.1                │ Can Implement   │
│ T-1.4 │ Remove Mock Catches in BFF       │ Sai Teja     │ P0       │ Indep.   │ —                    │ Can Implement   │
│ T-1.5 │ Firestore Security Rules Hardening│ Joint       │ P0       │ Joint    │ T-1.1                │ Can Implement   │
└───────┴──────────────────────────────────┴──────────────┴──────────┴──────────┴──────────────────────┴─────────────────┘
```

#### Task Details:
* **T-1.1: Role & UserProfile Schema Harmonization**
  * **Owner:** Nandhitha & Sai Teja (Joint) | **Priority:** P0 | **Mode:** Integration with Sandesh
  * **Affected Files:** `src/types/index.ts`, `src/modules/module3/components/AuthContext.tsx`
  * **Description:** Add `'Student Head'` to `UserProfile.role` union. Add `assignedCollegeId?: string` and `assignedCollegeName?: string` to user profile interface. Update AuthContext to expose role and college claims.
  * **Acceptance Criteria:** `user.role === 'Student Head'` is recognized across client components; TypeScript compiles without type errors on role checks.
  * **Testing:** TypeScript compiler check (`npx tsc --noEmit`).

* **T-1.2: College Data Contract & Service Interface**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Integration with Sandesh
  * **Affected Files:** `src/types/index.ts`, `src/lib/colleges.ts`
  * **Description:** Define standard `College` contract (`id`, `name`, `code`, `state`, `city`, `status`, `studentHeadId`). Create backend helper querying Sandesh's `colleges` collection with fallback to cached metadata.
  * **Acceptance Criteria:** Event creation forms and Student Head dashboards consume a single, typed college service rather than hardcoded static arrays.

* **T-1.3: Student Head Backend Authorization Guard**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/lib/auth-guards.ts`, `src/lib/firebase/admin-auth.ts`
  * **Description:** Build `verifyStudentHeadRequest(req, targetCollegeId)` server utility validating Firebase ID token, checking `role === 'Student Head'`, and strictly enforcing `user.assignedCollegeId === targetCollegeId`.
  * **Acceptance Criteria:** Rejects callers attempting to manage colleges other than their assigned institution with HTTP 403 Forbidden.

* **T-1.4: Eliminate Silent Mock Fallbacks in Student Dashboard BFF**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/modules/module2/services/*.ts`, `src/app/api/v1/module2/dashboard/route.ts`
  * **Description:** Remove silent catches in Module 2 that substitute mock arrays on DB failure. Update BFF to return explicit partial error indicators in trace metadata. Update `src/app/(dashboard)/dashboard/page.tsx` to handle empty and error states without rendering `MOCK_EVENTS` or `MOCK_MENTORS`.
  * **Acceptance Criteria:** When backend has 0 events, dashboard renders an empty state illustration; when backend fails, it displays an error banner with a retry button.

* **T-1.5: Firestore Security Rules Expansion**
  * **Owner:** Nandhitha & Sai Teja (Joint) | **Priority:** P0 | **Mode:** Joint
  * **Affected Files:** `firestore.rules`
  * **Description:** Update rules to restrict `/events/{id}` write to Admin and assigned Student Head. Lock `/eventRegistrations` writes to server-only (`allow write: if false`). Add college isolation rules for `/colleges`, `/eventReports`, and `/tasks`.
  * **Acceptance Criteria:** Unauthorized client-side writes to registrations or reports are rejected by security rules.

---

### PHASE 2: Event Management & Registration Integrity (Sprint 2)
*Focus: Admin event editing, eliminate duplicate payments, genuine cancellation, and external event rules.*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2 TASK MATRIX                                                                                                    │
├───────┬──────────────────────────────────┬──────────────┬──────────┬──────────┬──────────────────────┬─────────────────┤
│ ID    │ Task Name                        │ Owner        │ Priority │ Mode     │ Teammate Dependency  │ Blocker Status  │
├───────┼──────────────────────────────────┼──────────────┼──────────┼──────────┼──────────────────────┼─────────────────┤
│ T-2.1 │ Admin Event Edit UI & Connect    │ Nandhitha    │ P0       │ Indep.   │ T-1.1                │ Can Implement   │
│ T-2.2 │ Standardize Events API Response  │ Nandhitha    │ P1       │ Indep.   │ —                    │ Can Implement   │
│ T-2.3 │ Fix Paid Event Double Registration│ Nandhitha   │ P0       │ External │ Sri Nidhi (Payments) │ Can Implement   │
│ T-2.4 │ Registration Payment Protection  │ Nandhitha    │ P0       │ External │ Sri Nidhi (Payments) │ Can Implement   │
│ T-2.5 │ Genuine Registration Cancel API  │ Nandhitha    │ P0       │ Indep.   │ T-2.4                │ Can Implement   │
│ T-2.6 │ External Registration Enforcement│ Nandhitha    │ P0       │ Indep.   │ —                    │ Can Implement   │
│ T-2.7 │ Event Test Suite Expansion       │ Nandhitha    │ P1       │ Indep.   │ T-2.1 to T-2.6       │ Can Implement   │
└───────┴──────────────────────────────────┴──────────────┴──────────┴──────────┴──────────────────────┴─────────────────┘
```

#### Task Details:
* **T-2.1: Admin Event Edit UI & Connect**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(admin)/admin/events/[id]/edit/page.tsx`, `src/app/(admin)/admin/events/page.tsx`
  * **Description:** Implement full event edit page pre-populating all 25+ event fields from `GET /api/v1/events/[id]`. Connect form submission to `PUT /api/v1/events/[id]`. Add an "Edit" button to `/admin/events` action column.
  * **Acceptance Criteria:** Admins can modify title, venue, agenda, speaker details, and registration deadline. Updates persist to Firestore and reflect immediately in the event catalog.

* **T-2.2: Standardize Events API Response Format**
  * **Owner:** Nandhitha | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `src/app/api/v1/events/route.ts`
  * **Description:** Eliminate ambiguous referer check (`request.headers.get("referer")?.includes("/")`). Standardize all responses to `{ success: true, data: events, count: number }`.
  * **Acceptance Criteria:** Frontend consumers reliably parse `response.data` without conditional array/object fallbacks.

* **T-2.3: Fix Razorpay Paid Event Double-Registration Bug**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Integration with Sri Nidhi
  * **Affected Files:** `src/components/events/PaidEventCheckoutModal.tsx`, `src/app/api/v1/payments/verify/route.ts`
  * **Description:** In `PaidEventCheckoutModal.tsx`, upon Razorpay payment success, call `verifyRazorpayPayment()` (which atomically creates the registration and increments seats in `verify/route.ts`). **Remove the subsequent call to `/api/v1/events/[id]/register`**.
  * **Acceptance Criteria:** A successful paid registration produces exactly 1 document in `eventRegistrations` and increments `seatsBooked` by exactly 1.

* **T-2.4: Backend Registration Payment Tamper Protection**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Integration with Sri Nidhi
  * **Affected Files:** `src/app/api/v1/events/[id]/register/route.ts`
  * **Description:** Prevent clients from bypassing payment by supplying an unverified `paymentId`. If `effectivePrice > 0`, reject direct registration unless authorized via verified payment record. Free events proceed normally.
  * **Acceptance Criteria:** Direct POST to register on a paid event without prior verified payment returns HTTP 400.

* **T-2.5: Genuine Event Registration Cancellation API & UI**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/api/v1/events/[id]/cancel-registration/route.ts`, `src/app/(dashboard)/events/page.tsx`, `src/app/(dashboard)/events/[id]/page.tsx`
  * **Description:** Replace client-side fake cancellation (`setRegisteredList(filter)`) with genuine `POST /api/v1/events/[id]/cancel-registration`. Backend transaction sets registration status to `cancelled` and decrements `seatsBooked` and `registeredCount`.
  * **Acceptance Criteria:** Clicking cancel removes the registration from Firestore, decrements seat counts, and updates both student and admin dashboards.

* **T-2.6: External Registration Link Strict Enforcement**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/components/EventCard.tsx`, `src/app/(dashboard)/events/page.tsx`, `src/app/(dashboard)/events/[id]/page.tsx`
  * **Description:** If `registrationType === 'external'` and link is present, render "Register Externally" link. If external link is missing, display event details with "Registrations Closed / Link Pending" (never render internal registration button). External link clicks must never increment internal registration counts.
  * **Acceptance Criteria:** External events never create internal `eventRegistrations` records or trigger Razorpay checkout.

* **T-2.7: Event Module Test Suite Expansion**
  * **Owner:** Nandhitha | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `__tests__/api/event-registration.test.ts`, `__tests__/api/event-edit.test.ts`
  * **Description:** Author Jest unit and integration tests covering `PUT /api/v1/events/[id]`, registration cancellation, duplicate payment prevention, and external registration enforcement.
  * **Acceptance Criteria:** 100% test pass rate in Jest.

---

### PHASE 3: Student Head Workspace & Event Reports (Sprint 3)
*Focus: Dedicated Student Head portal, college member directory, college event creation, and complete Event Reports pipeline.*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3 TASK MATRIX                                                                                                    │
├───────┬──────────────────────────────────┬──────────────┬──────────┬──────────┬──────────────────────┬─────────────────┤
│ ID    │ Task Name                        │ Owner        │ Priority │ Mode     │ Teammate Dependency  │ Blocker Status  │
├───────┼──────────────────────────────────┼──────────────┼──────────┼──────────┼──────────────────────┼─────────────────┤
│ T-3.1 │ Student Head Dashboard Overview  │ Nandhitha    │ P0       │ External │ Sandesh (Colleges)   │ Can Implement   │
│ T-3.2 │ Student Head College Event Mgmt  │ Nandhitha    │ P0       │ Indep.   │ T-1.3, T-2.1         │ Can Implement   │
│ T-3.3 │ Student Head Member Directory    │ Nandhitha    │ P1       │ External │ Sandesh (Users)      │ Can Implement   │
│ T-3.4 │ Event Report Submission Workflow │ Nandhitha    │ P0       │ Indep.   │ T-1.3, T-3.2         │ Can Implement   │
│ T-3.5 │ Admin Report Review Portal       │ Nandhitha    │ P0       │ Indep.   │ T-3.4                │ Can Implement   │
│ T-3.6 │ Public College Reports Showcase  │ Nandhitha    │ P1       │ Indep.   │ T-3.5                │ Can Implement   │
│ T-3.7 │ Student Head & Reports Test Suite│ Nandhitha    │ P1       │ Indep.   │ T-3.1 to T-3.6       │ Can Implement   │
└───────┴──────────────────────────────────┴──────────────┴──────────┴──────────┴──────────────────────┴─────────────────┘
```

#### Task Details:
* **T-3.1: Student Head Dashboard Overview Page**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Integration with Sandesh
  * **Affected Files:** `src/app/(dashboard)/student-head/page.tsx`, `src/app/api/v1/student-head/overview/route.ts`
  * **Description:** Create role-gated overview showing assigned college info, total college members, active college events, recent activities, and quick action shortcuts.
  * **Acceptance Criteria:** Only authenticated users with `role === 'Student Head'` can access the route; data reflects only the caller's assigned college.

* **T-3.2: Student Head College Event Management UI & API**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(dashboard)/student-head/events/page.tsx`, `src/app/(dashboard)/student-head/events/create/page.tsx`, `src/app/api/v1/student-head/events/route.ts`
  * **Description:** Allow Student Heads to create/edit events for their assigned college only. Force `registrationType = 'external'`. Auto-set `collegeId` from auth token. Submit for Admin approval where required by policy. Prevent ANX payment processing.
  * **Acceptance Criteria:** Student Heads cannot specify internal registration or process ANX payments; college ID is strictly bound to caller's assignment.

* **T-3.3: Student Head College Member Directory**
  * **Owner:** Nandhitha | **Priority:** P1 | **Mode:** Integration with Sandesh
  * **Affected Files:** `src/app/(dashboard)/student-head/members/page.tsx`, `src/app/api/v1/student-head/members/route.ts`
  * **Description:** College-isolated member roster. Query users where `collegeId === caller.assignedCollegeId`. Search, filter by branch/year, and view student public profiles.
  * **Acceptance Criteria:** Zero cross-college data leakage. No access to students of other institutions.

* **T-3.4: Event Report Submission Workflow (Student Head)**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(dashboard)/student-head/reports/create/page.tsx`, `src/app/api/v1/events/[id]/report/route.ts`
  * **Description:** Allow Student Heads to submit post-event reports: outcomes, attendance count, summary description, and photo/document attachment links. Validates caller is the college head. Saves to `eventReports` collection with status `Submitted`.
  * **Acceptance Criteria:** Validated report submission saved with event linkage and timestamp.

* **T-3.5: Admin Event Report Review & Revision Portal**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(admin)/admin/reports/page.tsx`, `src/app/api/v1/admin/reports/[id]/review/route.ts`
  * **Description:** Admin interface to inspect submitted event reports. Actions: `Approve`, `Reject`, `Request Revisions` with mandatory feedback comments. Tracks revision history array.
  * **Acceptance Criteria:** Revision requests notify the Student Head; approved reports can be marked for public display.

* **T-3.6: Public College Event Reports Showcase**
  * **Owner:** Nandhitha | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `src/app/colleges/[collegeId]/reports/page.tsx`, `src/app/api/v1/colleges/[collegeId]/reports/route.ts`
  * **Description:** Public showcase route displaying verified event reports. Strictly query only reports where `status === 'Approved'` and `isPublic === true`.
  * **Acceptance Criteria:** Unapproved or private reports are never exposed publicly.

* **T-3.7: Student Head & Reports Test Suite**
  * **Owner:** Nandhitha | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `__tests__/api/student-head-permissions.test.ts`, `__tests__/api/event-reports.test.ts`
  * **Description:** Author Jest tests validating cross-college access rejection, report submission validation, admin approval transitions, and public filtering.
  * **Acceptance Criteria:** All test cases pass in Jest.

---

### PHASE 4: Student Hub & Community Completion (Sprint 2 & 3)
*Focus: Sai Teja's workstream to eliminate fake profile mutations, connect real dashboard feeds, and polish gamification & portfolios.*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4 TASK MATRIX                                                                                                    │
├───────┬──────────────────────────────────┬──────────────┬──────────┬──────────┬──────────────────────┬─────────────────┤
│ ID    │ Task Name                        │ Owner        │ Priority │ Mode     │ Teammate Dependency  │ Blocker Status  │
├───────┼──────────────────────────────────┼──────────────┼──────────┼──────────┼──────────────────────┼─────────────────┤
│ T-4.1 │ Real Profile Persistence API/UI  │ Sai Teja     │ P0       │ Indep.   │ T-1.1                │ Can Implement   │
│ T-4.2 │ Dashboard Real Feeds & Empty UI  │ Sai Teja     │ P0       │ Indep.   │ T-1.4, T-2.2         │ Can Implement   │
│ T-4.3 │ Digital Membership Card & QR     │ Sai Teja     │ P1       │ External │ Sri Nidhi (Member)   │ Can Implement   │
│ T-4.4 │ Student Portfolio Showcase Page  │ Sai Teja     │ P1       │ Indep.   │ T-4.1                │ Can Implement   │
│ T-4.5 │ Gamification XP Ledger Hardening │ Sai Teja     │ P1       │ Indep.   │ —                    │ Can Implement   │
│ T-4.6 │ Certificate Issuance & Verify    │ Sai Teja     │ P2       │ Indep.   │ —                    │ Can Implement   │
│ T-4.7 │ Student Hub Test Suite           │ Sai Teja     │ P1       │ Indep.   │ T-4.1 to T-4.5       │ Can Implement   │
└───────┴──────────────────────────────────┴──────────────┴──────────┴──────────┴──────────────────────┴─────────────────┘
```

#### Task Details:
* **T-4.1: Real Student Profile Persistence & Validation**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(dashboard)/profile/page.tsx`, `src/app/api/v1/users/profile/route.ts`
  * **Description:** Replace direct client-side Firestore write with secure server endpoint `PUT /api/v1/users/profile`. Remove fake success toast on DB error. Enforce URL formatting, bio length (<500 chars), and college selection.
  * **Acceptance Criteria:** Profile edits persist to Firestore; network or DB failures show accurate error banners without simulating success.

* **T-4.2: Student Dashboard Real Data Feeds & Empty States**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(dashboard)/dashboard/page.tsx`
  * **Description:** Reconnect dashboard cards (Upcoming Events, Registered Events, Announcements) to real API data. Implement elegant empty and retry states when no records exist. Zero mock fallbacks.
  * **Acceptance Criteria:** When user has no registrations, card displays "No registered events yet" instead of mock events.

* **T-4.3: Student Digital Membership Card & QR Verification**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Integration with Sri Nidhi
  * **Affected Files:** `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/MembershipCard.tsx`, `src/app/verify/[id]/page.tsx`
  * **Description:** Display student digital ID card with QR code encoding verified user ID and college affiliation. Read membership tier from Sri Nidhi's verified membership record. Connect to `/verify/[id]` public verification endpoint.
  * **Acceptance Criteria:** QR code scans to valid verification URL showing verified member status and college name.

* **T-4.4: Student Portfolio Showcase Page**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `src/app/(dashboard)/portfolio/page.tsx`, `src/app/api/v1/students/[id]/portfolio/route.ts`
  * **Description:** Aggregated portfolio view: student bio, completed projects, verified certificates, hackathon participations, earned badges, and leadership stage.
  * **Acceptance Criteria:** Responsive portfolio page shareable with recruiters.

* **T-4.5: Gamification XP Ledger & Badges Hardening**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `src/lib/gamification.ts`, `src/components/dashboard/GamificationWidget.tsx`, `src/app/api/gamification/grant-xp/route.ts`
  * **Description:** Audit idempotent XP transactions in `xpLedger`. Ensure XP triggers only from verified actions (e.g. event check-in, approved project). Display stage progression bar (Member -> Associate -> Lead -> Dept Head -> Core Team -> Director).
  * **Acceptance Criteria:** Repeat check-ins do not award duplicate XP; leadership stages recalculate atomically.

* **T-4.6: Certificate Generation & Verification Polish**
  * **Owner:** Sai Teja | **Priority:** P2 | **Mode:** Independent
  * **Affected Files:** `src/app/api/certificates/issue/route.ts`, `src/app/verify/[id]/page.tsx`
  * **Description:** Secure certificate issuance with SHA-256 verification hash. Test PDF generation and verify that public validation page accurately displays student and event metadata.
  * **Acceptance Criteria:** Downloaded PDF certificate contains verified hash and valid verification QR code.

* **T-4.7: Student Hub Test Suite**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `__tests__/api/student-profile.test.ts`, `__tests__/api/gamification-ledger.test.ts`
  * **Description:** Jest unit tests verifying profile updates, XP calculation thresholds, idempotency in `xpLedger`, and empty-state handling.
  * **Acceptance Criteria:** All test cases pass in Jest.

---

### PHASE 5: Mentor Hub & Calendar/Meet Engine (Sprint 3 & 4)
*Focus: Sai Teja's workstream to build the Mentor Dashboard and replace fake video URLs with genuine Google Meet / Calendar integration.*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5 TASK MATRIX                                                                                                    │
├───────┬──────────────────────────────────┬──────────────┬──────────┬──────────┬──────────────────────┬─────────────────┤
│ ID    │ Task Name                        │ Owner        │ Priority │ Mode     │ Teammate Dependency  │ Blocker Status  │
├───────┼──────────────────────────────────┼──────────────┼──────────┼──────────┼──────────────────────┼─────────────────┤
│ T-5.1 │ Dedicated Mentor Dashboard Portal│ Sai Teja     │ P0       │ External │ Sandesh (Mentors)    │ Can Implement   │
│ T-5.2 │ Student Booking Pipeline Audit   │ Sai Teja     │ P0       │ Indep.   │ T-5.1                │ Can Implement   │
│ T-5.3 │ Mentor Request Decision Workflow │ Sai Teja     │ P0       │ Indep.   │ T-5.2                │ Can Implement   │
│ T-5.4 │ Google Calendar & Real Meet Sync │ Sai Teja     │ P0       │ Indep.   │ T-5.3                │ Can Implement   │
│ T-5.5 │ Session Reschedule & Cancel Flow │ Sai Teja     │ P1       │ Indep.   │ T-5.4                │ Can Implement   │
│ T-5.6 │ Session Email & In-App Alerts    │ Sai Teja     │ P1       │ Indep.   │ T-5.4                │ Can Implement   │
│ T-5.7 │ Mentoring & Calendar Test Suite  │ Sai Teja     │ P1       │ Indep.   │ T-5.1 to T-5.6       │ Can Implement   │
└───────┴──────────────────────────────────┴──────────────┴──────────┴──────────┴──────────────────────┴─────────────────┘
```

#### Task Details:
* **T-5.1: Dedicated Mentor Dashboard Portal**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Integration with Sandesh
  * **Affected Files:** `src/app/(dashboard)/mentor/page.tsx`, `src/app/api/v1/mentor/requests/route.ts`
  * **Description:** Create dedicated workspace for authenticated mentors (`role === 'Mentor'`). Display incoming student session requests, schedule overview, accepted bookings, and student project reviews.
  * **Acceptance Criteria:** Mentors only view and manage sessions assigned to their verified account ID.

* **T-5.2: Student Mentoring Request & Booking Pipeline Audit**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(dashboard)/mentors/page.tsx`, `src/app/api/v1/mentors/[id]/book/route.ts`
  * **Description:** Audit booking modal on student discovery page. Remove fake Meet URL generator and in-memory fallback. Submitting a request creates a `mentorRequests` document with status `Pending`. Does NOT pre-schedule meeting.
  * **Acceptance Criteria:** Request creates database record without generating a fake video link.

* **T-5.3: Mentor Request Decision & Scheduling Workflow**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/api/v1/mentor/requests/[id]/decision/route.ts`, `src/app/(dashboard)/mentor/page.tsx`
  * **Description:** Allow mentors to `Accept` or `Decline` requests. When accepting, mentor selects date, time slot, and duration (30/45/60 mins). Status becomes `Accepted` (ready for Google Calendar sync).
  * **Acceptance Criteria:** Accepting a request prompts for schedule parameters; does not automatically assume arbitrary dates.

* **T-5.4: Google Calendar & Real Google Meet Integration Engine**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/lib/google-calendar.ts`, `src/app/api/v1/mentor/sessions/[id]/create-meet/route.ts`
  * **Description:** Integrate Google Calendar API using authorized service account credentials. When session is confirmed, automatically create calendar event with `conferenceDataVersion=1`. Save verified `meet.google.com/...` link. Never use Jitsi or fake links.
  * **Acceptance Criteria:** Real Google Meet conference link generated by Google API and presented to both participants.

* **T-5.5: Session Rescheduling, Cancellation & Audit History**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `src/app/api/v1/mentor/sessions/[id]/reschedule/route.ts`, `src/app/api/v1/mentor/sessions/[id]/cancel/route.ts`
  * **Description:** Mentors and students can reschedule or cancel sessions with reason. Rescheduling updates Google Calendar event; cancellation removes calendar event and disables the "Join Meeting" action. Full audit trail preserved.
  * **Acceptance Criteria:** Cancelled sessions cannot be joined; rescheduled sessions synchronize new times to Google Calendar.

* **T-5.6: Session Email & In-App Notification Dispatch**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `src/lib/notifications.ts`, `src/lib/email-templates.ts`
  * **Description:** Send real confirmation emails (via Resend) with ICS calendar invite to both student and mentor upon conference creation. Send alert notifications upon rescheduling or cancellation.
  * **Acceptance Criteria:** Valid ICS calendar attachment sent to both student and mentor emails.

* **T-5.7: Mentoring & Calendar Integration Test Suite**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `__tests__/api/mentoring-lifecycle.test.ts`, `__tests__/api/google-calendar.test.ts`
  * **Description:** Author Jest tests mocking Google Calendar API responses, verifying conference creation, request accept/decline state machine, and cancellation rules.
  * **Acceptance Criteria:** All test cases pass in Jest.

---

### PHASE 6: Tasks, Challenges & Announcements Expansion (Sprint 4)
*Focus: Complete Task/Challenge creation, submission, and review ecosystem, alongside college-scoped announcements.*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6 TASK MATRIX                                                                                                    │
├───────┬──────────────────────────────────┬──────────────┬──────────┬──────────┬──────────────────────┬─────────────────┤
│ ID    │ Task Name                        │ Owner        │ Priority │ Mode     │ Teammate Dependency  │ Blocker Status  │
├───────┼──────────────────────────────────┼──────────────┼──────────┼──────────┼──────────────────────┼─────────────────┤
│ T-6.1 │ Admin & College Task Creation    │ Nandhitha    │ P0       │ External │ Sandesh (Colleges)   │ Can Implement   │
│ T-6.2 │ Student Task Discovery & Submit  │ Sai Teja     │ P0       │ Indep.   │ T-6.1                │ Can Implement   │
│ T-6.3 │ Task Evaluation & XP Awarding    │ Nandhitha    │ P0       │ Indep.   │ T-6.2, T-4.5         │ Can Implement   │
│ T-6.4 │ College-Scoped Announcements     │ Nandhitha    │ P1       │ External │ Sandesh (Colleges)   │ Can Implement   │
│ T-6.5 │ Notification Bell Sync           │ Sai Teja     │ P1       │ Indep.   │ T-6.4                │ Can Implement   │
│ T-6.6 │ Tasks & Announcements Test Suite │ Joint        │ P1       │ Joint    │ T-6.1 to T-6.5       │ Can Implement   │
└───────┴──────────────────────────────────┴──────────────┴──────────┴──────────┴──────────────────────┴─────────────────┘
```

#### Task Details:
* **T-6.1: Admin & College Task Creation Engine**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Integration with Sandesh
  * **Affected Files:** `src/app/(admin)/admin/tasks/create/page.tsx`, `src/app/api/v1/tasks/route.ts`
  * **Description:** Create task management: title, description, track/category, college scope (`All Campuses` or specific college), deadline, XP reward, and starter assets.
  * **Acceptance Criteria:** Tasks persist with college targeting; Student Heads can create tasks for their assigned college.

* **T-6.2: Student Task Discovery & Submission Portal**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(dashboard)/tasks/page.tsx`, `src/app/(dashboard)/tasks/[id]/page.tsx`, `src/app/api/v1/tasks/[id]/submit/route.ts`
  * **Description:** Students discover active tasks filtered by college and track. Submit assignments via GitHub repository URL, live demo link, or summary notes. Submission status tracks `Submitted` -> `Under Review` -> `Approved` / `Revision Needed`.
  * **Acceptance Criteria:** Student submissions recorded with timestamps and submission URLs; duplicate submissions update existing draft.

* **T-6.3: Task Evaluation, Feedback & XP Awarding**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** `src/app/(admin)/admin/tasks/submissions/page.tsx`, `src/app/api/v1/admin/tasks/submissions/[id]/review/route.ts`
  * **Description:** Admin / Student Head review interface for submitted assignments. Approve with feedback comments and automatically credit XP via `awardXP()` in `xpLedger`.
  * **Acceptance Criteria:** Approving a submission updates status and credits verified XP to student's profile.

* **T-6.4: College-Scoped & Expiring Announcements**
  * **Owner:** Nandhitha | **Priority:** P1 | **Mode:** Integration with Sandesh
  * **Affected Files:** `src/app/api/v1/announcements/route.ts`, `src/app/(admin)/admin/broadcast/page.tsx`, `src/app/(dashboard)/student-head/announcements/page.tsx`
  * **Description:** Add `POST /api/v1/announcements` supporting college targeting (`targetCollegeId` or global), expiry dates (`expiresAt`), and priority badges. Student Heads can broadcast to their assigned college. Filter out expired broadcasts.
  * **Acceptance Criteria:** Expired announcements are automatically hidden from student feeds; college broadcasts appear only for students of that campus.

* **T-6.5: Dashboard Notification Bell & Indicator Sync**
  * **Owner:** Sai Teja | **Priority:** P1 | **Mode:** Independent
  * **Affected Files:** `src/components/layout/NotificationBell.tsx`, `src/app/api/v1/notifications/route.ts`
  * **Description:** Unify notification bell across admin, student head, student, and mentor headers. Real-time unread badge counter, mark-all-as-read, and deep links to relevant events/sessions.
  * **Acceptance Criteria:** Notification counter syncs dynamically on mark-as-read.

* **T-6.6: Tasks & Announcements Test Suite**
  * **Owner:** Nandhitha & Sai Teja (Joint) | **Priority:** P1 | **Mode:** Joint
  * **Affected Files:** `__tests__/api/tasks-lifecycle.test.ts`, `__tests__/api/announcements-scoping.test.ts`
  * **Description:** Author Jest unit tests covering task assignment permissions, deadline validation, student submission state machine, and announcement expiry filtering.
  * **Acceptance Criteria:** All test cases pass in Jest.

---

### PHASE 7: System Integration, Security Hardening & Post-Firebase Verification (Sprint 5)
*Focus: Full end-to-end integration and live verification following Tech Head resolution of the Firebase blocker.*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7 TASK MATRIX                                                                                                    │
├───────┬──────────────────────────────────┬──────────────┬──────────┬──────────┬──────────────────────┬─────────────────┤
│ ID    │ Task Name                        │ Owner        │ Priority │ Mode     │ Teammate Dependency  │ Blocker Status  │
├───────┼──────────────────────────────────┼──────────────┼──────────┼──────────┼──────────────────────┼─────────────────┤
│ T-7.1 │ Firestore Connection Live Check  │ Joint        │ P0       │ Infra    │ Tech Head (Firebase) │ 🔴 Blocked Live │
│ T-7.2 │ E2E Event Lifecycle Smoke Test   │ Nandhitha    │ P0       │ Indep.   │ T-7.1, T-2.1 to T-3.6│ 🔴 Blocked Live │
│ T-7.3 │ E2E Mentoring & Meet Smoke Test  │ Sai Teja     │ P0       │ Indep.   │ T-7.1, T-5.1 to T-5.6│ 🔴 Blocked Live │
│ T-7.4 │ Cross-Role Penetration Audit     │ Joint        │ P0       │ Joint    │ T-7.1                │ 🔴 Blocked Live │
│ T-7.5 │ Composite Index Optimization     │ Joint        │ P1       │ Joint    │ T-7.1                │ 🔴 Blocked Live │
└───────┴──────────────────────────────────┴──────────────┴──────────┴──────────┴──────────────────────┴─────────────────┘
```

#### Task Details:
* **T-7.1: Firestore Live Database Connection Verification**
  * **Owner:** Nandhitha & Sai Teja (Joint) | **Priority:** P0 | **Mode:** Infrastructure Unblock
  * **Affected Files:** `src/lib/firebase/admin.ts`, `.env`
  * **Description:** **EXECUTE ONLY AFTER TECH HEAD RESOLUTION**. Test read/write connectivity across all collections in Native Firestore mode. Verify no `DATA_ACCESS_MODE_DISABLED` errors occur.
  * **Acceptance Criteria:** Clean write and read from Firestore collections in production environment.

* **T-7.2: End-to-End Event Lifecycle Smoke Test**
  * **Owner:** Nandhitha | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** Complete Platform
  * **Description:** Verify live creation -> publish -> external/internal registration -> cancellation -> soft deletion -> report submission -> admin review -> public showcase in live cloud environment.
  * **Acceptance Criteria:** Complete lifecycle functions end-to-end in browser.

* **T-7.3: End-to-End Mentoring & Google Meet Smoke Test**
  * **Owner:** Sai Teja | **Priority:** P0 | **Mode:** Independent
  * **Affected Files:** Complete Platform
  * **Description:** Verify live student request -> mentor accept -> real Google Meet creation -> calendar sync -> reschedule -> cancellation in live cloud environment.
  * **Acceptance Criteria:** Real Google Meet conference link generated and joined by test accounts.

* **T-7.4: Cross-Role Authorization Penetration Audit**
  * **Owner:** Nandhitha & Sai Teja (Joint) | **Priority:** P0 | **Mode:** Joint
  * **Affected Files:** All API Routes
  * **Description:** Attempt unauthorized cross-college accesses, student-calling-admin endpoints, and direct unverified registration writes. Ensure 100% of unauthorized attempts are blocked with HTTP 401/403.
  * **Acceptance Criteria:** Zero security leaks or bypasses across all routes.

* **T-7.5: Performance & Query Optimization**
  * **Owner:** Nandhitha & Sai Teja (Joint) | **Priority:** P1 | **Mode:** Joint
  * **Affected Files:** `firestore.indexes.json`
  * **Description:** Ensure all composite queries (e.g. `events` by `collegeId` + `date`, `eventReports` by `collegeId` + `isPublic`) have verified indexes. Minimize document read operations.
  * **Acceptance Criteria:** Zero missing index errors in production logs.

---

## 5. Teammate Coordination & Handoff Specifications

### 5.1 Sandesh Handoff Specification (Authentication & Colleges)
* **What We Consume from Sandesh:**
  1. Authenticated session token via `Authorization: Bearer <token>`.
  2. Verified user claims: `role` (`'Admin' | 'Student Head' | 'Student' | 'Mentor'`) and `assignedCollegeId`.
  3. `colleges` collection in Firestore:
     ```typescript
     interface College {
       id: string;
       name: string;
       code: string;
       state: string;
       city: string;
       status: 'active' | 'pending' | 'suspended';
       studentHeadId?: string;
       createdAt: string;
     }
     ```
* **Our Commitment:** We do not touch authentication configuration or college CRUD operations. If a college entity bug arises, we document it and hand it off to Sandesh.

### 5.2 Sri Nidhi Handoff Specification (Razorpay & Memberships)
* **What We Consume from Sri Nidhi:**
  1. Payment verification handler `POST /api/v1/payments/verify`.
  2. `memberships` collection records:
     ```typescript
     interface Membership {
       id: string;
       userId: string;
       plan: 'monthly_149' | 'annual_999';
       status: 'active' | 'expired';
       startDate: string;
       endDate: string;
       razorpayPaymentId: string;
     }
     ```
* **Our Commitment:** We do not touch Razorpay secrets, webhook handlers, or pricing tier logic. We consume payment verification results to confirm paid event tickets and display membership badges.

---

## 6. Definition of Done & Quality Standards

1. **Zero Mock Fallbacks in Production Code:** No hardcoded demo records, mock arrays (`MOCK_EVENTS`, `MOCK_MENTORS`), or in-memory stores (`memoryStore`) in production execution paths.
2. **Transparent Error Handling:** Network and database failures must return explicit HTTP 500/503 statuses and render retryable error states in the UI. Never fake success.
3. **Server-Side Authorization:** Every mutation must be verified on the server using verified tokens and role claims.
4. **Strict College Isolation:** Student Heads and students can only access data belonging to their institution or public records.
5. **Real External Integrations:** Google Meet conferencing must use the authorized Google Calendar API engine.
6. **100% Test Pass Rate:** All new endpoints and state machines must be accompanied by Jest test suites with full branch coverage.

---
*Roadmap updated and synchronized with `INTERNSHIP_WORK_LOG.md`. Ready for implementation upon authorization.*
