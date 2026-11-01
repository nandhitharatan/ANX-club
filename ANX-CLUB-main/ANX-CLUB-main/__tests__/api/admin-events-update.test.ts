import { NextRequest } from "next/server";
import { PUT } from "@/app/api/v1/events/[id]/route";
import {
  validateEventUpdatePayload,
  isValidHttpUrl,
  PROTECTED_EVENT_FIELDS,
} from "@/lib/events/validation";
import * as adminAuthUtil from "@/lib/firebase/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

// Mock Firebase Admin modules
jest.mock("@/lib/firebase/admin", () => {
  const mockUpdate = jest.fn();
  const mockSet = jest.fn();
  const mockGet = jest.fn();
  const mockAdd = jest.fn();
  const mockDoc = jest.fn(() => ({
    get: mockGet,
    update: mockUpdate,
    set: mockSet,
    id: "mock-doc-id",
  }));

  return {
    adminDb: {
      collection: jest.fn(() => ({
        doc: mockDoc,
        get: jest.fn(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        add: mockAdd,
      })),
      runTransaction: jest.fn(async (cb) => {
        return cb({
          get: mockGet,
          update: mockUpdate,
          set: mockSet,
        });
      }),
    },
    adminAuth: {
      verifyIdToken: jest.fn(),
    },
  };
});

jest.mock("@/lib/firebase/admin-auth", () => ({
  verifyAuthToken: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authenticate: jest.fn(),
}));

describe("Event Update API Validation & Security (PUT /api/v1/events/:id)", () => {
  const adminUser = {
    uid: "admin_core_test",
    email: "admin@algorithmaliens.com",
    role: "Admin",
  };

  const sampleExistingEvent = {
    id: "evt-100",
    title: "AI & Fullstack Workshop",
    description: "Hands-on next.js and AI tools",
    date: "2026-12-01",
    time: "10:00 AM",
    venue: "Main Auditorium",
    isOnline: false,
    registrationType: "internal",
    price: 99,
    capacity: 100,
    seatsBooked: 25,
    registeredCount: 25,
    seatsAvailable: 75,
    status: "Published",
    isPublished: true,
    isActive: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    createdBy: "admin_original",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Validation Utilities & Rules
  // =========================================================================
  describe("1. Validation Logic & Invariants (validateEventUpdatePayload)", () => {
    it("validates URL formats with isValidHttpUrl", () => {
      expect(isValidHttpUrl("https://meet.google.com/abc-xyz")).toBe(true);
      expect(isValidHttpUrl("http://example.com/register")).toBe(true);
      expect(isValidHttpUrl("ftp://invalid-url")).toBe(false);
      expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
      expect(isValidHttpUrl("not-a-url")).toBe(false);
      expect(isValidHttpUrl("")).toBe(false);
      expect(isValidHttpUrl(null)).toBe(false);
    });

    it("rejects editing a deleted or archived event", () => {
      const archived = { ...sampleExistingEvent, isActive: false, status: "Deleted" };
      const res = validateEventUpdatePayload({ title: "New Title" }, archived);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Cannot edit a deleted or archived event");
    });

    it("rejects empty or whitespace-only title", () => {
      const res1 = validateEventUpdatePayload({ title: "" }, sampleExistingEvent);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain("title is required");

      const res2 = validateEventUpdatePayload({ title: "   " }, sampleExistingEvent);
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain("title is required");
    });

    it("rejects empty or whitespace-only description", () => {
      const res = validateEventUpdatePayload({ description: "   " }, sampleExistingEvent);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("description is required");
    });

    it("rejects invalid date format", () => {
      const res = validateEventUpdatePayload({ date: "invalid-date-string" }, sampleExistingEvent);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Invalid event date format");
    });

    it("rejects end date before event date", () => {
      const res = validateEventUpdatePayload(
        { date: "2026-12-05", endDate: "2026-12-01" },
        sampleExistingEvent
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("end date cannot be scheduled before");
    });

    it("rejects registration deadline scheduled after event date", () => {
      const res = validateEventUpdatePayload(
        { date: "2026-12-01", registrationDeadline: "2026-12-05" },
        sampleExistingEvent
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Registration deadline cannot be scheduled after");
    });

    it("accepts valid registration deadline scheduled before event date", () => {
      const res = validateEventUpdatePayload(
        { date: "2026-12-01", registrationDeadline: "2026-11-25" },
        sampleExistingEvent
      );
      expect(res.valid).toBe(true);
      expect(res.sanitizedUpdates?.registrationDeadline).toBe("2026-11-25");
    });

    it("rejects invalid external registration URL for external registration events", () => {
      const res = validateEventUpdatePayload(
        { registrationType: "external", externalRegistrationUrl: "not-a-valid-link" },
        sampleExistingEvent
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("External registration link must be a valid URL");
    });

    it("requires externalRegistrationUrl when registrationType is external", () => {
      const res = validateEventUpdatePayload(
        { registrationType: "external", externalRegistrationUrl: "" },
        { ...sampleExistingEvent, externalRegistrationUrl: "" }
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("External registration link must be a valid URL");
    });

    it("rejects invalid meeting URL for online events", () => {
      const res = validateEventUpdatePayload(
        { isOnline: true, meetingLink: "invalid-link" },
        sampleExistingEvent
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Meeting link must be a valid URL");
    });

    it("rejects empty venue for physical events", () => {
      const res = validateEventUpdatePayload(
        { isOnline: false, venue: "   " },
        sampleExistingEvent
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Physical events require a valid venue location");
    });

    it("rejects negative event pricing", () => {
      const res = validateEventUpdatePayload({ price: -10 }, sampleExistingEvent);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("price must be a non-negative number");
    });

    it("rejects negative premium pricing", () => {
      const res = validateEventUpdatePayload({ premiumPrice: -5 }, sampleExistingEvent);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Premium price must be a non-negative number");
    });

    it("rejects zero or negative capacity for internal events", () => {
      const res1 = validateEventUpdatePayload({ capacity: 0 }, sampleExistingEvent);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain("capacity must be a positive integer");

      const res2 = validateEventUpdatePayload({ capacity: -50 }, sampleExistingEvent);
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain("capacity must be a positive integer");
    });

    it("rejects non-integer capacity", () => {
      const res = validateEventUpdatePayload({ capacity: 55.5 }, sampleExistingEvent);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("capacity must be a positive integer");
    });

    it("rejects reducing capacity below the number of currently booked seats", () => {
      // sampleExistingEvent has 25 seatsBooked
      const res = validateEventUpdatePayload({ capacity: 20 }, sampleExistingEvent);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Cannot reduce capacity to 20");
      expect(res.error).toContain("currently booked seats (25)");
    });

    it("maintains seatsAvailable invariant when capacity increases", () => {
      // sampleExistingEvent has 25 seatsBooked. New capacity: 150 -> seatsAvailable: 125
      const res = validateEventUpdatePayload({ capacity: 150 }, sampleExistingEvent);
      expect(res.valid).toBe(true);
      expect(res.sanitizedUpdates?.capacity).toBe(150);
      expect(res.sanitizedUpdates?.seatsAvailable).toBe(125);
    });

    it("strips protected fields completely from update payload", () => {
      const payloadWithProtectedFields = {
        title: "Updated Title",
        createdAt: "2020-01-01T00:00:00Z",
        createdBy: "attacker_user",
        seatsBooked: 0,
        registeredCount: 0,
        status: "Draft", // Attempting to unpublish or alter lifecycle
        isPublished: false,
        isActive: false,
        cancelledAt: "2026-11-01T00:00:00Z",
        deletedAt: "2026-11-01T00:00:00Z",
      };

      const res = validateEventUpdatePayload(payloadWithProtectedFields, sampleExistingEvent);
      expect(res.valid).toBe(true);
      const updates = res.sanitizedUpdates!;
      expect(updates.title).toBe("Updated Title");

      // Verify all protected fields were stripped
      PROTECTED_EVENT_FIELDS.forEach((field) => {
        expect(updates).not.toHaveProperty(field);
      });
    });
  });

  // =========================================================================
  // 2. HTTP Security & Authorization
  // =========================================================================
  describe("2. Security & Authorization Checks", () => {
    it("rejects unauthenticated requests with HTTP 401", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/v1/events/evt-100", {
        method: "PUT",
        body: JSON.stringify({ title: "New Title" }),
      });

      const res = await PUT(req, { params: { id: "evt-100" } });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("rejects non-admin role callers with HTTP 403", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce({
        uid: "student_user_1",
        email: "student@anxclub.dev",
        role: "Member",
      });

      const req = new NextRequest("http://localhost/api/v1/events/evt-100", {
        method: "PUT",
        body: JSON.stringify({ title: "New Title" }),
      });

      const res = await PUT(req, { params: { id: "evt-100" } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Forbidden");
    });
  });

  // =========================================================================
  // 3. Database State & Error Handling
  // =========================================================================
  describe("3. Database State & Error Handling", () => {
    it("returns HTTP 503 when Firestore database read fails", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockRejectedValueOnce(new Error("DATA_ACCESS_MODE_DISABLED")),
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new NextRequest("http://localhost/api/v1/events/evt-100", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Title" }),
      });

      const res = await PUT(req, { params: { id: "evt-100" } });
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Database service unavailable");
    });

    it("returns HTTP 404 when target event does not exist", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({ exists: false }),
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new NextRequest("http://localhost/api/v1/events/evt-missing", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Title" }),
      });

      const res = await PUT(req, { params: { id: "evt-missing" } });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Event not found");
    });

    it("returns HTTP 400 when attempting to update an archived/deleted event", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({ ...sampleExistingEvent, isActive: false, status: "Deleted" }),
        }),
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new NextRequest("http://localhost/api/v1/events/evt-100", {
        method: "PUT",
        body: JSON.stringify({ title: "New Title" }),
      });

      const res = await PUT(req, { params: { id: "evt-100" } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Cannot edit a deleted/archived event");
    });

    it("returns HTTP 400 when validation fails on invalid payload", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => sampleExistingEvent,
        }),
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new NextRequest("http://localhost/api/v1/events/evt-100", {
        method: "PUT",
        body: JSON.stringify({ title: "" }), // Empty title
      });

      const res = await PUT(req, { params: { id: "evt-100" } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Event title is required");
    });

    it("returns HTTP 503 when Firestore update call fails", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => sampleExistingEvent,
        }),
        update: jest.fn().mockRejectedValueOnce(new Error("Write error")),
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new NextRequest("http://localhost/api/v1/events/evt-100", {
        method: "PUT",
        body: JSON.stringify({ title: "New Title", description: "New Description" }),
      });

      const res = await PUT(req, { params: { id: "evt-100" } });
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Failed to save updates");
    });
  });

  // =========================================================================
  // 4. Valid Update Execution & Contract
  // =========================================================================
  describe("4. Successful Update Execution", () => {
    it("successfully updates event with sanitized updates and maintains invariants", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockUpdate = jest.fn().mockResolvedValueOnce(true);
      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => sampleExistingEvent,
        }),
        update: mockUpdate,
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const updatePayload = {
        title: "Advanced Next.js Architecture Masterclass",
        description: "In-depth look at App Router and server actions",
        date: "2026-12-10",
        time: "11:00 AM",
        capacity: 150, // Capacity increased from 100 to 150; 25 seatsBooked
        price: 149,
        // Client maliciously or erroneously passes protected fields:
        status: "Draft",
        isPublished: false,
        seatsBooked: 0,
        registeredCount: 0,
        createdAt: "1999-01-01",
        createdBy: "evil_hacker",
      };

      const req = new NextRequest("http://localhost/api/v1/events/evt-100", {
        method: "PUT",
        body: JSON.stringify(updatePayload),
      });

      const res = await PUT(req, { params: { id: "evt-100" } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Event updated.");
      expect(json.data.title).toBe("Advanced Next.js Architecture Masterclass");

      // Verify what was sent to Firestore update:
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const passedToFirestore = mockUpdate.mock.calls[0][0];

      // Sanitized updates must include:
      expect(passedToFirestore.title).toBe("Advanced Next.js Architecture Masterclass");
      expect(passedToFirestore.capacity).toBe(150);
      expect(passedToFirestore.seatsAvailable).toBe(125); // 150 - 25 booked

      // Protected fields MUST NOT be passed to Firestore:
      expect(passedToFirestore).not.toHaveProperty("status");
      expect(passedToFirestore).not.toHaveProperty("isPublished");
      expect(passedToFirestore).not.toHaveProperty("seatsBooked");
      expect(passedToFirestore).not.toHaveProperty("registeredCount");
      expect(passedToFirestore).not.toHaveProperty("createdAt");
      expect(passedToFirestore).not.toHaveProperty("createdBy");
    });
  });
});
