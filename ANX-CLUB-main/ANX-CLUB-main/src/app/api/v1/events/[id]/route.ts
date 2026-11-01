import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { getNormalizedLifecycleStatus } from "@/lib/events/lifecycle";
import { verifyAdminRequest } from "@/lib/events/lifecycle-server";
import { validateEventUpdatePayload } from "@/lib/events/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    let eventData: any = null;

    try {
      const doc = await adminDb.collection("events").doc(id).get();
      if (doc.exists) {
        const d = doc.data() || {};
        eventData = {
          id: doc.id,
          ...d,
          date: d.date?.toDate ? d.date.toDate().toISOString() : d.date,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        };
      }
    } catch (dbErr: any) {
      console.error(`Firestore get event ${id} error:`, dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, message: "Database service unavailable." },
        { status: 503 }
      );
    }

    if (!eventData || eventData.isActive === false || eventData.status === "Deleted") {
      return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
    }

    const currentStatus = getNormalizedLifecycleStatus(eventData);

    // If event is Draft/Unpublished, only administrators may inspect it
    if (currentStatus === "Draft") {
      const authResult = await verifyAdminRequest(request);
      if (!authResult.isAuthorized) {
        return NextResponse.json({ success: false, message: "Event not found or unpublished." }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...eventData,
        normalizedStatus: currentStatus,
      },
      ...eventData,
      normalizedStatus: currentStatus,
    }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/v1/events/:id]", error);
    return NextResponse.json({ success: false, message: "Server error.", error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.isAuthorized || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: authResult.errorResponse?.message || "Forbidden: Administrator role required" },
        { status: authResult.errorResponse?.status || 403 }
      );
    }

    const { id } = params;
    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ success: false, message: "Valid event ID is required." }, { status: 400 });
    }

    let existingDoc: any;
    try {
      existingDoc = await adminDb.collection("events").doc(id).get();
    } catch (dbErr: any) {
      console.error(`[PUT /api/v1/events/${id}] Firestore get error:`, dbErr?.message || dbErr);
      return NextResponse.json({ success: false, message: "Database service unavailable." }, { status: 503 });
    }

    if (!existingDoc.exists) {
      return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
    }

    const existingData = existingDoc.data() || {};
    if (existingData.isActive === false || existingData.status === "Deleted") {
      return NextResponse.json({ success: false, message: "Cannot edit a deleted/archived event." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    // Server-side validation, field protection, and seats invariant calculation
    const validation = validateEventUpdatePayload(body, existingData);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error || "Invalid event update data." },
        { status: 400 }
      );
    }

    const sanitizedUpdates = validation.sanitizedUpdates || {};

    try {
      await adminDb.collection("events").doc(id).update({
        ...sanitizedUpdates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (saveErr: any) {
      console.error(`[PUT /api/v1/events/${id}] Firestore update error:`, saveErr?.message || saveErr);
      return NextResponse.json(
        { success: false, message: "Database service unavailable. Failed to save updates." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event updated.",
      data: {
        id,
        ...existingData,
        ...sanitizedUpdates,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("[PUT /api/v1/events/:id]", error);
    return NextResponse.json({ success: false, message: "Server error.", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.isAuthorized || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: authResult.errorResponse?.message || "Forbidden: Administrator role required" },
        { status: authResult.errorResponse?.status || 403 }
      );
    }

    const { id } = params;
    let existingDoc: any;
    try {
      existingDoc = await adminDb.collection("events").doc(id).get();
    } catch (dbErr: any) {
      return NextResponse.json({ success: false, message: "Database service unavailable." }, { status: 503 });
    }

    if (!existingDoc.exists) {
      return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
    }

    const existingData = existingDoc.data() || {};
    if (existingData.isActive === false || existingData.status === "Deleted") {
      return NextResponse.json({ success: false, message: "Event is already deleted/archived." }, { status: 400 });
    }

    // Soft deletion: safely archive without deleting registrations or payment records
    await adminDb.collection("events").doc(id).update({
      isActive: false,
      status: "Deleted",
      isPublished: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: authResult.userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Event archived successfully. Registrations and payment history preserved.",
    });
  } catch (error: any) {
    console.error("[DELETE /api/v1/events/:id]", error);
    return NextResponse.json({ success: false, message: "Server error.", error: error.message }, { status: 500 });
  }
}
