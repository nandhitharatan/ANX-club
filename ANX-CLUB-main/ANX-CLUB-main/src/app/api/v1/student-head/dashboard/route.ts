import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyStudentHeadRequest } from "@/lib/student-head/auth";
import { getNormalizedLifecycleStatus } from "@/lib/events/lifecycle";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize caller & resolve trusted college identity
    const authResult = await verifyStudentHeadRequest(request);
    if (!authResult.isAuthorized || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.errorResponse?.message || "Forbidden: Access denied.",
        },
        { status: authResult.errorResponse?.status || 403 }
      );
    }

    const { collegeId, collegeName } = authResult;

    if (!collegeId) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid college assignment is required to view chapter metrics.",
        },
        { status: 400 }
      );
    }

    // 2. Query Events for this college with strict server-side college isolation
    let eventsSnapshot: any;
    try {
      eventsSnapshot = await adminDb
        .collection("events")
        .where("collegeId", "==", collegeId)
        .get();
    } catch (dbErr: any) {
      console.error(`[StudentHeadDashboard] Firestore events error for ${collegeId}:`, dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, message: "Database service unavailable. Unable to load chapter events." },
        { status: 503 }
      );
    }

    const allEvents = eventsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      normalizedStatus: getNormalizedLifecycleStatus({ id: doc.id, ...doc.data() }),
    }));

    // Filter out deleted / archived events
    const activeEvents = allEvents.filter((e: any) => e.normalizedStatus !== "Deleted");

    // Events status breakdown
    const publishedEventsCount = activeEvents.filter((e: any) => e.normalizedStatus === "Published").length;
    const draftEventsCount = activeEvents.filter((e: any) => e.normalizedStatus === "Draft").length;
    const cancelledEventsCount = activeEvents.filter((e: any) => e.normalizedStatus === "Cancelled").length;

    // Upcoming events (date >= today and not cancelled)
    const nowIso = new Date().toISOString().split("T")[0];
    const upcomingEvents = activeEvents
      .filter((e: any) => {
        const d = String(e.date || "").split("T")[0];
        return d >= nowIso && e.normalizedStatus !== "Cancelled";
      })
      .sort((a: any, b: any) => String(a.date || "").localeCompare(String(b.date || "")))
      .slice(0, 5);

    // 3. Query Chapter Members (only from existing users collection)
    let chapterMembersCount = 0;
    try {
      const membersSnapshot = await adminDb
        .collection("users")
        .where("collegeId", "==", collegeId)
        .get();
      chapterMembersCount = membersSnapshot.size || 0;

      // Safe fallback: match by collegeName if collegeId returned zero and collegeName exists
      if (chapterMembersCount === 0 && collegeName && collegeName !== collegeId) {
        const nameSnapshot = await adminDb
          .collection("users")
          .where("collegeName", "==", collegeName)
          .get();
        chapterMembersCount = nameSnapshot.size || 0;
      }
    } catch (memberErr: any) {
      console.warn(`[StudentHeadDashboard] Members fetch warning for ${collegeId}:`, memberErr?.message || memberErr);
    }

    // 4. Query Announcements (only if supported in existing collections)
    let activeAnnouncementsCount = 0;
    let recentAnnouncements: any[] = [];
    try {
      const annSnapshot = await adminDb.collection("announcements").get();
      const allAnnouncements = annSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter announcements relevant to this college chapter or general ecosystem alerts
      const relevantAnnouncements = allAnnouncements.filter((a: any) => {
        return (
          a.collegeId === collegeId ||
          !a.collegeId ||
          a.targetCohort === "all" ||
          a.targetCohort === "members"
        );
      });
      activeAnnouncementsCount = relevantAnnouncements.length;
      recentAnnouncements = relevantAnnouncements.slice(0, 3);
    } catch (annErr) {
      // Non-blocking
    }

    // 5. Query Pending Event Reports (only if supported)
    let pendingReportsCount = 0;
    try {
      const reportsSnapshot = await adminDb
        .collection("eventReports")
        .where("collegeId", "==", collegeId)
        .get();
      pendingReportsCount = reportsSnapshot.docs.filter((doc: any) => {
        const st = (doc.data()?.status || "").toLowerCase();
        return st === "pending" || st === "submitted" || st === "under_review";
      }).length;
    } catch (reportErr) {
      // Non-blocking
    }

    // 6. Return verified response
    return NextResponse.json(
      {
        success: true,
        college: {
          id: collegeId,
          name: collegeName || "Assigned College Chapter",
        },
        stats: {
          totalEvents: activeEvents.length,
          publishedEvents: publishedEventsCount,
          draftEvents: draftEventsCount,
          cancelledEvents: cancelledEventsCount,
          upcomingEventsCount: upcomingEvents.length,
          chapterMembersCount,
          activeAnnouncementsCount,
          pendingReportsCount,
        },
        upcomingEvents,
        recentAnnouncements,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/v1/student-head/dashboard] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error.", error: error?.message || error },
      { status: 500 }
    );
  }
}
