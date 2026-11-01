import { NextRequest, NextResponse } from "next/server";
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
import { isOfficialAdminEmail } from '@/lib/admin-auth-config';
import { getNormalizedLifecycleStatus } from '@/lib/events/lifecycle';
import { verifyAdminRequest } from '@/lib/events/lifecycle-server';
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const collegeFilter = searchParams.get("college") || searchParams.get("collegeId");
    const onlyUpcoming = searchParams.get("upcoming") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const statusFilter = searchParams.get("status");
    const requestIncludeAll = searchParams.get("all") === "true" || searchParams.get("admin") === "true" || searchParams.get("includeDrafts") === "true";

    let isAdminCaller = false;
    if (requestIncludeAll) {
      const auth = await verifyAdminRequest(request);
      isAdminCaller = auth.isAuthorized;
    }

    let firestoreEvents: any[] = [];
    try {
      const snapshot = await adminDb.collection("events").get();
      
      firestoreEvents = snapshot.docs
        .map((doc: any) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
            normalizedStatus: getNormalizedLifecycleStatus({ id: doc.id, ...data }),
          };
        });

      if (!isAdminCaller) {
        // Students & public callers must never see deleted or unpublished/draft events
        firestoreEvents = firestoreEvents.filter((e: any) => {
          return e.normalizedStatus !== 'Deleted' && e.normalizedStatus !== 'Draft';
        });
      }
    } catch (dbErr: any) {
      console.error(`[GET /api/v1/events] Firestore connection error:`, dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: "Database service unavailable. Unable to load events." },
        { status: 503 }
      );
    }

    let events = firestoreEvents;

    // Filter by lifecycle status if requested
    if (statusFilter && statusFilter !== "All" && statusFilter !== "all") {
      events = events.filter((e: any) =>
        (e.normalizedStatus || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by event type
    if (typeFilter && typeFilter !== "All" && typeFilter !== "all") {
      events = events.filter((e: any) => 
        (e.eventType || e.category || "").toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // Filter by college
    if (collegeFilter && collegeFilter !== "All" && collegeFilter !== "all") {
      events = events.filter((e: any) => 
        (e.collegeId || e.collegeName || "").toLowerCase().includes(collegeFilter.toLowerCase())
      );
    }

    // Filter upcoming only
    if (onlyUpcoming) {
      const nowStr = new Date().toISOString();
      events = events.filter((e: any) => {
        const d = e.date instanceof Date ? e.date.toISOString() : String(e.date || "");
        return d >= nowStr || d.split('T')[0] >= nowStr.split('T')[0];
      });
    }

    // Sort in-memory based on requested field
    events.sort((a, b) => {
      const valA = a[sortBy] instanceof Date ? a[sortBy].toISOString() : String(a[sortBy] || "");
      const valB = b[sortBy] instanceof Date ? b[sortBy].toISOString() : String(b[sortBy] || "");
      if (sortOrder === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    if (events.length > limit) {
      events = events.slice(0, limit);
    }

    const isModule3Request = request.headers.get("referer")?.includes("/") || 
                             request.url.includes("module3");
    
    let response: NextResponse;
    if (isModule3Request) {
      response = NextResponse.json(events, { status: 200 });
    } else {
      response = NextResponse.json(
        { success: true, data: events, count: events.length },
        { status: 200 }
      );
    }

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=10, stale-while-revalidate=30"
    );

    return response;
  } catch (error: any) {
    console.error("[GET /api/v1/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve events." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    let userId = authUser?.uid;
    const userEmail = (authUser?.email || "").toLowerCase().trim();
    let isAuthorized = authUser?.role?.toLowerCase() === "admin" || 
                       authUser?.role?.toLowerCase() === "student head" ||
                       isOfficialAdminEmail(userEmail) ||
                       userEmail === "admin@anxclub.dev";

    if (!isAuthorized) {
      const fallbackUid = await authenticate(request);
      if (fallbackUid) {
        userId = fallbackUid;
        if (fallbackUid === "admin_user" || fallbackUid === "admin_anx_core") {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized || !userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You must be an administrator or authorized student head to create events." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title?.trim();
    const description = body.description?.trim();
    const date = body.date?.trim();

    if (!title || !description || !date) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: title, description, and date are required." },
        { status: 400 }
      );
    }

    const time = body.time?.trim() || "10:00 AM";
    const duration = Number(body.duration) || 120;
    const eventType = body.eventType || body.category || "workshop";
    const category = body.category || eventType;
    const venue = body.venue?.trim() || (body.isOnline ? "Online Live Stream" : "Campus Hall A");
    const isOnline = body.isOnline !== undefined ? Boolean(body.isOnline) : venue.toLowerCase().includes("online");
    const speaker = body.speaker?.trim() || body.speakerName?.trim() || "ANX Mentor";
    const speakerRole = body.speakerRole?.trim() || body.speakerDesignation?.trim() || "";
    const speakerCompany = body.speakerCompany?.trim() || "";
    const speakerBio = body.speakerBio?.trim() || "Engineering Lead & Industry Mentor";
    const speakerImage = body.speakerImage?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker || 'Speaker')}&background=8b5cf6&color=fff`;
    const address = body.address?.trim() || "";
    const agenda = Array.isArray(body.agenda) ? body.agenda.filter((item: any) => typeof item === 'string' && item.trim().length > 0) : [];
    const meetingPlatform = body.meetingPlatform?.trim() || (isOnline ? "Google Meet" : "");
    const meetingId = body.meetingId?.trim() || "";
    const meetingPasscode = body.meetingPasscode?.trim() || "";
    const meetingInstructions = body.meetingInstructions?.trim() || "";
    const price = body.price ? Number(body.price) : 0;
    const premiumOnly = Boolean(body.premiumOnly);
    const premiumPrice = body.premiumPrice ? Number(body.premiumPrice) : (premiumOnly ? 0 : price);
    const registrationDeadline = body.registrationDeadline?.trim() || null;
    const capacity = Number(body.capacity || body.seatsAvailable || 100);
    const seatsAvailable = capacity;
    const posterUrl = body.posterUrl?.trim() || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop";
    const onlineLink = body.meetingLink?.trim() || body.onlineLink?.trim() || (isOnline ? "https://meet.google.com/anx-masterclass" : "");
    const collegeId = body.collegeId?.trim() || null;
    const collegeName = body.collegeName?.trim() || "All Campuses";
    const registrationType = body.registrationType || "internal";
    const externalRegistrationUrl = body.externalRegistrationUrl?.trim() || null;

    const eventData = {
      title,
      description,
      date,
      time,
      duration,
      venue,
      address,
      isOnline,
      meetingLink: onlineLink,
      meetingPlatform,
      meetingId,
      meetingPasscode,
      meetingInstructions,
      speaker,
      speakerName: speaker,
      speakerRole,
      speakerCompany,
      speakerBio,
      speakerImage,
      agenda,
      category,
      eventType,
      price,
      premiumPrice,
      premiumOnly,
      registrationDeadline,
      capacity,
      seatsAvailable,
      seatsBooked: 0,
      registeredCount: 0,
      posterUrl,
      onlineLink,
      collegeId,
      collegeName,
      registrationType,
      externalRegistrationUrl,
      createdBy: userId,
      createdByRole: authUser?.role || "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      isPublished: body.status?.toLowerCase() === 'draft' || Boolean(body.isDraft) ? false : true,
      status: body.status?.toLowerCase() === 'draft' || Boolean(body.isDraft) ? "Draft" : "Published",
    };

    let docRef;
    try {
      docRef = await adminDb.collection("events").add({
        ...eventData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (saveErr: any) {
      console.error(`[POST /api/v1/events] Firestore save error:`, saveErr?.message || saveErr);
      return NextResponse.json(
        { success: false, message: "Database error: Failed to persist event to Firestore." },
        { status: 503 }
      );
    }

    const createdEvent = { id: docRef.id, ...eventData };

    return NextResponse.json(
      { success: true, message: "Event created successfully.", data: createdEvent },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`[POST /api/v1/events] Error:`, error?.message || error);
    return NextResponse.json(
      { success: false, message: "Failed to create event.", error: error?.message || error },
      { status: 500 }
    );
  }
}
