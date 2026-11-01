import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/admin-auth";
import { authenticate } from "@/lib/auth";
import { isOfficialAdminEmail } from "@/lib/admin-auth-config";

export interface StudentHeadAuthResult {
  isAuthorized: boolean;
  userId?: string;
  userEmail?: string;
  role?: string;
  collegeId?: string;
  collegeName?: string;
  errorResponse?: {
    status: number;
    message: string;
  };
}

/**
 * Server-only helper: Authenticates and authorizes a Student Head or Administrator.
 *
 * Strict Security Rules:
 * 1. Reject unauthenticated requests with HTTP 401.
 * 2. Reject unauthorized roles (Members, Visitors, etc.) with HTTP 403.
 * 3. Enforce that Student Heads have a valid assigned collegeId in their server Firestore record.
 * 4. Never accept collegeId from an untrusted query parameter or request body for Student Heads.
 * 5. Return a trusted, server-derived college identity.
 */
export async function verifyStudentHeadRequest(
  request: Request
): Promise<StudentHeadAuthResult> {
  try {
    // 1. Authenticate identity via Firebase Bearer Token or Session Cookie
    const verifiedUser = await verifyAuthToken(request);
    let userId = verifiedUser?.uid;
    let userEmail = (verifiedUser?.email || "").toLowerCase().trim();

    if (!userId) {
      const fallbackUid = await authenticate(request);
      if (fallbackUid) {
        userId = fallbackUid;
      }
    }

    if (!userId) {
      return {
        isAuthorized: false,
        errorResponse: {
          status: 401,
          message: "Unauthorized: Authentication required.",
        },
      };
    }

    // 2. Fetch authoritative user record from Firestore to determine role and college assignment
    let userDoc: any;
    try {
      userDoc = await adminDb.collection("users").doc(userId).get();
    } catch (dbErr: any) {
      console.error(`[StudentHeadAuth] Firestore user fetch error for ${userId}:`, dbErr?.message || dbErr);
      return {
        isAuthorized: false,
        errorResponse: {
          status: 503,
          message: "Database service unavailable. Unable to verify permissions.",
        },
      };
    }

    const userData = userDoc && userDoc.exists ? userDoc.data() || {} : {};
    if (!userEmail && userData.email) {
      userEmail = String(userData.email).toLowerCase().trim();
    }

    const rawRole = (userData.role || verifiedUser?.role || "").toLowerCase().trim();
    const isStudentHead =
      rawRole === "student head" ||
      rawRole === "studenthead" ||
      rawRole === "student_head";

    const isAdmin =
      rawRole === "admin" ||
      isOfficialAdminEmail(userEmail) ||
      userEmail === "admin@anxclub.dev" ||
      userId === "admin_user" ||
      userId === "admin_anx_core";

    if (!isStudentHead && !isAdmin) {
      return {
        isAuthorized: false,
        userId,
        userEmail,
        role: rawRole || "user",
        errorResponse: {
          status: 403,
          message: "Forbidden: Student Head or Administrator role required.",
        },
      };
    }

    // 3. Resolve trusted, server-derived college identity
    let collegeId: string | undefined = undefined;
    let collegeName: string | undefined = undefined;

    if (isStudentHead) {
      // For Student Heads, collegeId MUST come strictly from their server user profile.
      // Untrusted query parameters or request body parameters are strictly rejected as an auth source.
      collegeId = userData.collegeId || userData.college_id;
      collegeName = userData.collegeName || userData.college;

      if (!collegeId || typeof collegeId !== "string" || !collegeId.trim()) {
        return {
          isAuthorized: false,
          userId,
          userEmail,
          role: "Student Head",
          errorResponse: {
            status: 403,
            message: "Forbidden: Student Head account has no assigned college.",
          },
        };
      }

      collegeId = collegeId.trim();
      collegeName = collegeName ? String(collegeName).trim() : collegeId;
    } else if (isAdmin) {
      // For Administrators, check if an assigned college exists, or allow scoping via query parameter
      const url = new URL(request.url);
      const queryCollegeId = url.searchParams.get("collegeId") || url.searchParams.get("college");

      collegeId = (queryCollegeId || userData.collegeId || userData.college_id || "").trim() || undefined;
      collegeName = (userData.collegeName || userData.college || queryCollegeId || "").trim() || undefined;
    }

    return {
      isAuthorized: true,
      userId,
      userEmail,
      role: isAdmin ? "Admin" : "Student Head",
      collegeId,
      collegeName,
    };
  } catch (error: any) {
    console.error("[StudentHeadAuth] Unexpected error during verification:", error);
    return {
      isAuthorized: false,
      errorResponse: {
        status: 500,
        message: `Internal authorization error: ${error?.message || error}`,
      },
    };
  }
}
