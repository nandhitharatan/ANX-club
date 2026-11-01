import { NextRequest } from "next/server";
import { GET } from "@/app/api/v1/student-head/dashboard/route";
import { verifyStudentHeadRequest } from "@/lib/student-head/auth";
import * as adminAuthUtil from "@/lib/firebase/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

// Mock Firebase Admin modules
jest.mock("@/lib/firebase/admin", () => {
  const mockGet = jest.fn();
  const mockDoc = jest.fn(() => ({
    get: mockGet,
  }));

  const mockCollection = jest.fn(() => ({
    doc: mockDoc,
    where: jest.fn().mockReturnThis(),
    get: mockGet,
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }));

  return {
    adminDb: {
      collection: mockCollection,
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

describe("Student Head Authorization & Dashboard API Foundation", () => {
  const studentHeadUserA = {
    uid: "head_user_gec_1",
    email: "head@gec.edu",
    role: "Student Head",
  };

  const gecUserDocData = {
    uid: "head_user_gec_1",
    email: "head@gec.edu",
    role: "Student Head",
    collegeId: "gec-campus-1",
    collegeName: "Govt Engineering College",
  };

  const studentHeadWithoutCollege = {
    uid: "head_user_orphan",
    email: "head.orphan@example.edu",
    role: "Student Head",
  };

  const orphanUserDocData = {
    uid: "head_user_orphan",
    email: "head.orphan@example.edu",
    role: "Student Head",
    // No collegeId or collegeName
  };

  const normalMember = {
    uid: "student_regular_1",
    email: "student@gec.edu",
    role: "Member",
  };

  const memberUserDocData = {
    uid: "student_regular_1",
    email: "student@gec.edu",
    role: "Member",
    collegeId: "gec-campus-1",
  };

  const adminUser = {
    uid: "admin_core_test",
    email: "admin@algorithmaliens.com",
    role: "Admin",
  };

  const adminUserDocData = {
    uid: "admin_core_test",
    email: "admin@algorithmaliens.com",
    role: "Admin",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Authorization Helper: verifyStudentHeadRequest
  // =========================================================================
  describe("1. Authorization Helper: verifyStudentHeadRequest", () => {
    it("rejects unauthenticated requests with HTTP 401", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/v1/student-head/dashboard");
      const authResult = await verifyStudentHeadRequest(req);

      expect(authResult.isAuthorized).toBe(false);
      expect(authResult.errorResponse?.status).toBe(401);
      expect(authResult.errorResponse?.message).toContain("Authentication required");
    });

    it("rejects unauthorized roles (e.g. Member, Visitor) with HTTP 403", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(normalMember);

      const mockDoc = {
        exists: true,
        data: () => memberUserDocData,
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValueOnce(mockDoc),
        }),
      });

      const req = new Request("http://localhost/api/v1/student-head/dashboard");
      const authResult = await verifyStudentHeadRequest(req);

      expect(authResult.isAuthorized).toBe(false);
      expect(authResult.errorResponse?.status).toBe(403);
      expect(authResult.errorResponse?.message).toContain("Student Head or Administrator role required");
    });

    it("rejects Student Head accounts without assigned collegeId with HTTP 403", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(studentHeadWithoutCollege);

      const mockDoc = {
        exists: true,
        data: () => orphanUserDocData,
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValueOnce(mockDoc),
        }),
      });

      const req = new Request("http://localhost/api/v1/student-head/dashboard");
      const authResult = await verifyStudentHeadRequest(req);

      expect(authResult.isAuthorized).toBe(false);
      expect(authResult.errorResponse?.status).toBe(403);
      expect(authResult.errorResponse?.message).toContain("no assigned college");
    });

    it("authorizes valid Student Head and returns trusted server-derived college identity", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(studentHeadUserA);

      const mockDoc = {
        exists: true,
        data: () => gecUserDocData,
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValueOnce(mockDoc),
        }),
      });

      const req = new Request("http://localhost/api/v1/student-head/dashboard");
      const authResult = await verifyStudentHeadRequest(req);

      expect(authResult.isAuthorized).toBe(true);
      expect(authResult.userId).toBe("head_user_gec_1");
      expect(authResult.role).toBe("Student Head");
      expect(authResult.collegeId).toBe("gec-campus-1");
      expect(authResult.collegeName).toBe("Govt Engineering College");
    });

    it("returns HTTP 503 when Firestore user lookup fails", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(studentHeadUserA);

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValueOnce(new Error("DATA_ACCESS_MODE_DISABLED: Native mode is disabled")),
        }),
      });

      const req = new Request("http://localhost/api/v1/student-head/dashboard");
      const authResult = await verifyStudentHeadRequest(req);

      expect(authResult.isAuthorized).toBe(false);
      expect(authResult.errorResponse?.status).toBe(503);
      expect(authResult.errorResponse?.message).toContain("Database service unavailable");
    });
  });

  // =========================================================================
  // 2. Dashboard API Endpoint & College Isolation
  // =========================================================================
  describe("2. Dashboard API Endpoint (GET /api/v1/student-head/dashboard)", () => {
    it("returns HTTP 401 on unauthenticated call to dashboard API", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/v1/student-head/dashboard");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Authentication required");
    });

    it("returns HTTP 403 when a regular Member calls student head dashboard API", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(normalMember);

      const mockDoc = {
        exists: true,
        data: () => memberUserDocData,
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValueOnce(mockDoc),
        }),
      });

      const req = new NextRequest("http://localhost/api/v1/student-head/dashboard");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Student Head or Administrator role required");
    });

    it("returns HTTP 503 when Firestore events query fails", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(studentHeadUserA);

      const mockUserDoc = {
        exists: true,
        data: () => gecUserDocData,
      };

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValueOnce(new Error("Database connection failed")),
      });

      (adminDb.collection as jest.Mock).mockImplementation((colName: string) => {
        if (colName === "users") {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValueOnce(mockUserDoc),
            }),
          };
        }
        return {
          where: mockWhere,
        };
      });

      const req = new NextRequest("http://localhost/api/v1/student-head/dashboard");
      const res = await GET(req);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain("Database service unavailable");
    });

    it("enforces strict college isolation: College A data is isolated from College B", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(studentHeadUserA);

      const mockUserDoc = {
        exists: true,
        data: () => gecUserDocData, // collegeId: "gec-campus-1"
      };

      // Events in database: Only College A events should be returned
      const collegeAEvents = [
        {
          id: "evt-gec-1",
          title: "GEC React Workshop",
          collegeId: "gec-campus-1",
          collegeName: "Govt Engineering College",
          status: "Published",
          isPublished: true,
          date: "2026-12-01",
          registrationType: "external",
          externalRegistrationUrl: "https://forms.gle/gec-react",
        },
        {
          id: "evt-gec-2",
          title: "GEC Hackathon Prep",
          collegeId: "gec-campus-1",
          collegeName: "Govt Engineering College",
          status: "Draft",
          isPublished: false,
          date: "2026-12-20",
          registrationType: "external",
        },
      ];

      const whereQuerySpy = jest.fn();

      (adminDb.collection as jest.Mock).mockImplementation((colName: string) => {
        if (colName === "users") {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValueOnce(mockUserDoc),
            }),
            where: jest.fn().mockImplementation((field, op, val) => {
              whereQuerySpy("users", field, val);
              return {
                get: jest.fn().mockResolvedValueOnce({
                  size: 42, // 42 members in GEC
                  docs: [],
                }),
              };
            }),
          };
        }
        if (colName === "events") {
          return {
            where: jest.fn().mockImplementation((field, op, val) => {
              whereQuerySpy("events", field, val);
              return {
                get: jest.fn().mockResolvedValueOnce({
                  docs: collegeAEvents.map((evt) => ({
                    id: evt.id,
                    data: () => evt,
                  })),
                }),
              };
            }),
          };
        }
        if (colName === "announcements") {
          return {
            get: jest.fn().mockResolvedValueOnce({
              docs: [
                {
                  id: "ann-1",
                  data: () => ({
                    title: "Campus Hackathon Scheduled",
                    collegeId: "gec-campus-1",
                    targetCohort: "all",
                  }),
                },
                {
                  id: "ann-other",
                  data: () => ({
                    title: "IIT Delhi Private Notice",
                    collegeId: "iit-delhi",
                    targetCohort: "iit_only",
                  }),
                },
              ],
            }),
          };
        }
        if (colName === "eventReports") {
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValueOnce({
                docs: [
                  { id: "rep-1", data: () => ({ status: "pending" }) },
                ],
              }),
            }),
          };
        }
        return { get: jest.fn().mockResolvedValue({ docs: [] }) };
      });

      // Untrusted caller attempts to supply ?collegeId=iit-delhi in query param
      const req = new NextRequest("http://localhost/api/v1/student-head/dashboard?collegeId=iit-delhi");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      // Trusted college must match Student Head's genuine collegeId, NOT the spoofed param
      expect(json.college.id).toBe("gec-campus-1");
      expect(json.college.name).toBe("Govt Engineering College");

      // Verify that Firestore queries were strictly filtered by "gec-campus-1"
      expect(whereQuerySpy).toHaveBeenCalledWith("events", "collegeId", "gec-campus-1");
      expect(whereQuerySpy).toHaveBeenCalledWith("users", "collegeId", "gec-campus-1");

      // Verify statistical counts
      expect(json.stats.totalEvents).toBe(2);
      expect(json.stats.publishedEvents).toBe(1);
      expect(json.stats.draftEvents).toBe(1);
      expect(json.stats.chapterMembersCount).toBe(42);
      expect(json.stats.pendingReportsCount).toBe(1);
      expect(json.stats.activeAnnouncementsCount).toBe(1); // Only 1 matched gec-campus-1; iit-delhi ignored

      // Verify upcoming events
      expect(json.upcomingEvents.length).toBe(2);
      expect(json.upcomingEvents[0].id).toBe("evt-gec-1");
    });

    it("successfully permits Admin to inspect college dashboard via query parameter", async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockAdminDoc = {
        exists: true,
        data: () => adminUserDocData,
      };

      const whereQuerySpy = jest.fn();

      (adminDb.collection as jest.Mock).mockImplementation((colName: string) => {
        if (colName === "users") {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValueOnce(mockAdminDoc),
            }),
            where: jest.fn().mockImplementation((field, op, val) => {
              whereQuerySpy("users", field, val);
              return {
                get: jest.fn().mockResolvedValueOnce({
                  size: 15,
                  docs: [],
                }),
              };
            }),
          };
        }
        if (colName === "events") {
          return {
            where: jest.fn().mockImplementation((field, op, val) => {
              whereQuerySpy("events", field, val);
              return {
                get: jest.fn().mockResolvedValueOnce({ docs: [] }),
              };
            }),
          };
        }
        return {
          get: jest.fn().mockResolvedValue({ docs: [] }),
          where: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ docs: [] }) }),
        };
      });

      const req = new NextRequest("http://localhost/api/v1/student-head/dashboard?collegeId=nit-warangal");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.college.id).toBe("nit-warangal");
      expect(whereQuerySpy).toHaveBeenCalledWith("events", "collegeId", "nit-warangal");
    });
  });
});
