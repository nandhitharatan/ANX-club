import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { authenticate } from "@/lib/auth";
import { verifyAuthToken } from "@/lib/firebase/admin-auth";
import { getNormalizedLifecycleStatus } from "@/lib/events/lifecycle";
import * as admin from "firebase-admin";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    const authUserId = verifiedUser?.uid || await authenticate(request);

    if (!authUserId) {
      return NextResponse.json({ success: false, message: "Authentication required to register for events." }, { status: 401 });
    }

    const userId = authUserId;
    const { id: eventId } = params;
    const body = await request.json().catch(() => ({}));

    // Fetch genuine event from Firestore
    let event: any = null;
    try {
      const eventDoc = await adminDb.collection("events").doc(eventId).get();
      if (eventDoc.exists && eventDoc.data()?.isActive !== false) {
        event = { id: eventDoc.id, ...eventDoc.data() };
      }
    } catch (dbErr: any) {
      console.error("[register] Firestore event fetch error:", dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, message: "Database service unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
    }

    // Lifecycle enforcement: Block registration for cancelled, draft, or deleted events
    const lifecycleStatus = getNormalizedLifecycleStatus(event);
    if (lifecycleStatus === 'Cancelled') {
      return NextResponse.json({
        success: false,
        message: `Registration blocked: This event has been cancelled${event.cancellationReason ? ` (${event.cancellationReason})` : ''}.`,
        cancellationReason: event.cancellationReason || null,
        isCancelled: true,
      }, { status: 400 });
    }

    if (lifecycleStatus === 'Draft') {
      return NextResponse.json({
        success: false,
        message: "Registration is not available. This event is currently unpublished or in draft status.",
        isPublished: false,
      }, { status: 400 });
    }

    if (lifecycleStatus === 'Deleted') {
      return NextResponse.json({
        success: false,
        message: "Registration unavailable: Event not found or archived.",
      }, { status: 404 });
    }

    // Check if event is external-only
    if (event.registrationType === 'external' && event.externalRegistrationUrl) {
      return NextResponse.json({
        success: false,
        message: "This event uses external registration. Please register using the official external link.",
        externalUrl: event.externalRegistrationUrl
      }, { status: 400 });
    }

    // Check deadline
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (new Date() > deadline) {
        return NextResponse.json({ success: false, message: "Registration deadline has passed." }, { status: 400 });
      }
    }

    // Check seats
    const seatsAvailable = event.seatsAvailable ?? event.seats ?? event.capacity ?? 100;
    const seatsBooked = event.seatsBooked ?? event.registeredCount ?? 0;
    if (seatsAvailable !== null && seatsAvailable !== undefined) {
      if (seatsBooked >= seatsAvailable && seatsAvailable > 0) {
        return NextResponse.json({ success: false, message: "No seats available. Event is fully booked." }, { status: 400 });
      }
    }

    // Duplicate registration check in Firestore
    try {
      const existingReg = await adminDb.collection("eventRegistrations")
        .where("userId", "==", userId)
        .where("eventId", "==", eventId)
        .limit(1)
        .get();

      if (!existingReg.empty) {
        return NextResponse.json({ success: false, message: "You are already registered for this event." }, { status: 409 });
      }
    } catch (dupErr: any) {
      console.warn("Firestore duplicate registration check error:", dupErr?.message || dupErr);
    }

    let user: any = {};
    try {
      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (userDoc.exists) user = userDoc.data() || {};
    } catch (uErr) {}

    const isPremiumUser = user.membershipType === "premium" || user.role === "Premium Member";
    const effectivePrice =
      event.eventType === "paid" || event.eventType === "premium" || (event.price && event.price > 0)
        ? isPremiumUser && event.premiumPrice !== undefined
          ? event.premiumPrice
          : event.price
        : 0;

    const registrationData = {
      eventId,
      eventTitle: event.title,
      userId,
      name: body.name || user.fullName || verifiedUser?.email?.split('@')[0] || "Member",
      email: body.email || user.email || verifiedUser?.email || "",
      phone: body.phone || user.phoneNumber || user.phone || "",
      membershipType: user.membershipType || (isPremiumUser ? "premium" : "free"),
      college: event.collegeName || user.collegeName || "",
      paymentStatus: effectivePrice > 0 ? (body.paymentId ? "paid" : "pending") : "not_required",
      paymentId: body.paymentId || null,
      orderId: body.orderId || null,
      amount: effectivePrice,
      status: "confirmed",
      registeredAt: new Date().toISOString(),
    };

    let regId: string;
    try {
      const result = await adminDb.runTransaction(async (transaction) => {
        const eventRef = adminDb.collection("events").doc(eventId);
        const eventSnap = await transaction.get(eventRef);
        
        if (!eventSnap.exists) {
          throw new Error("EVENT_NOT_FOUND");
        }

        const eventData = eventSnap.data()!;
        const transStatus = getNormalizedLifecycleStatus(eventData);
        if (transStatus === "Cancelled") {
          throw new Error("EVENT_CANCELLED");
        }
        if (transStatus === "Draft") {
          throw new Error("EVENT_UNPUBLISHED");
        }
        if (transStatus === "Deleted") {
          throw new Error("EVENT_DELETED");
        }

        const seats = eventData.seatsAvailable ?? eventData.seats ?? eventData.capacity ?? 100;
        const booked = eventData.seatsBooked ?? eventData.registeredCount ?? 0;
        if (seats != null && booked >= seats && seats > 0) {
          throw new Error("EVENT_SOLD_OUT");
        }

        transaction.update(eventRef, {
          seatsBooked: admin.firestore.FieldValue.increment(1),
          registeredCount: admin.firestore.FieldValue.increment(1),
        });

        const regRef = adminDb.collection("eventRegistrations").doc();
        transaction.set(regRef, {
          ...registrationData,
          id: regRef.id,
          registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { registrationId: regRef.id };
      });
      regId = result.registrationId;
    } catch (txErr: any) {
      console.error("[register] Firestore transaction error:", txErr?.message || txErr);
      if (txErr.message === "EVENT_CANCELLED") {
        return NextResponse.json({ success: false, message: "Registration blocked: This event has been cancelled." }, { status: 400 });
      }
      if (txErr.message === "EVENT_UNPUBLISHED") {
        return NextResponse.json({ success: false, message: "Registration blocked: This event is currently unpublished." }, { status: 400 });
      }
      if (txErr.message === "EVENT_DELETED" || txErr.message === "EVENT_NOT_FOUND") {
        return NextResponse.json({ success: false, message: "Event not found or removed." }, { status: 404 });
      }
      if (txErr.message === "EVENT_SOLD_OUT") {
        return NextResponse.json({ success: false, message: "No seats available. Event is fully booked." }, { status: 400 });
      }
      return NextResponse.json(
        { success: false, message: "Failed to complete registration in database. " + (txErr.message || "") },
        { status: 503 }
      );
    }

    // Generate Ticket ID & Seat Number
    const ticketId = `ANX-TCK-${Date.now().toString().slice(-6)}`;
    const seatNumber = `Seat #${((event.seatsBooked || event.registeredCount || 0) + 1)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify({ ticketId, eventId, eventTitle: event.title, userId, name: registrationData.name }))}`;

    // Optional confirmation email
    if (registrationData.email) {
      try {
        const { sendEmail } = await import("@/lib/resend");
        const { eventRegistrationEmail, paidEventTicketEmail } = await import("@/lib/email-templates");

        if (effectivePrice > 0) {
          await sendEmail(
            registrationData.email,
            `🎟️ VIP Event Pass & Ticket: ${event.title}`,
            paidEventTicketEmail({
              eventName: event.title,
              userName: registrationData.name,
              userEmail: registrationData.email,
              date: typeof event.date === 'string' ? event.date : new Date(event.date).toISOString().split('T')[0],
              time: event.time || '10:00 AM',
              venue: event.venue || (event.isOnline ? 'Online Live Stream' : 'Campus Hall A'),
              ticketId,
              seatNumber,
              amount: effectivePrice,
              qrCodeUrl,
              meetingLink: event.meetingLink || event.onlineLink || undefined
            })
          );
        } else {
          await sendEmail(
            registrationData.email,
            `Registration Confirmed: ${event.title}`,
            eventRegistrationEmail(
              event.title, 
              registrationData.name,
              typeof event.date === 'string' ? event.date : new Date(event.date).toISOString().split('T')[0],
              event.time || '10:00 AM',
              event.venue || (event.isOnline ? 'Online Stream' : 'Campus Hall A'),
              event.meetingLink || event.onlineLink || undefined
            )
          );
        }
      } catch (emailErr) {
        console.warn("Event registration confirmation email notice:", emailErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        paymentRequired: false,
        message: effectivePrice > 0 
          ? "Payment verified! Your VIP Ticket with QR code has been issued." 
          : "Successfully registered! Confirmation sent to your email.",
        data: { 
          registrationId: regId,
          ticketId,
          seatNumber,
          qrCodeUrl,
          xpAwarded: 50
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/v1/events/:id/register]", error);
    return NextResponse.json({ success: false, message: error.message || "Registration failed." }, { status: 500 });
  }
}
