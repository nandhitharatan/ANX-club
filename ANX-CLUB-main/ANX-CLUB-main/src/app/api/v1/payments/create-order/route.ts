import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { adminDb } from "@/lib/firebase/admin";
import { authenticate } from "@/lib/auth";
import * as admin from "firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { eventId, paymentType, billingPeriod = "annual" } = await request.json();
    const isMembership = paymentType === "membership";
    if (!eventId && !isMembership) {
      return NextResponse.json({ success: false, message: "eventId or membership paymentType is required." }, { status: 400 });
    }

    if (isMembership) {
      const amount = billingPeriod === "monthly" ? 149 : 999;
      const order = await createRazorpayOrder({
        amount,
        currency: "INR",
        receipt: `membership_${userId.slice(0, 8)}_${Date.now()}`,
        notes: { userId, paymentType, billingPeriod },
      });
      await adminDb.collection("payments").doc(order.id).set({
        orderId: order.id,
        userId,
        amount,
        currency: "INR",
        status: "pending",
        paymentType: "membership",
        billingPeriod,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    }

    const eventDoc = await adminDb.collection("events").doc(eventId).get();
    if (!eventDoc.exists || eventDoc.data()?.isActive === false) {
      return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
    }
    const event = eventDoc.data()!;

    // Check seats
    const seatsAvailable = event.seatsAvailable ?? event.seats;
    const seatsBooked = event.seatsBooked ?? event.registeredCount ?? 0;
    if (seatsAvailable !== null && seatsAvailable !== undefined) {
      if (seatsBooked >= seatsAvailable) {
        return NextResponse.json({ success: false, message: "No seats available." }, { status: 400 });
      }
    }

    // Determine pricing
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const user = userDoc.data() || {};
    const isPremium = user.membershipType === "premium" || user.role === "Premium Member";
    const amount = isPremium && event.premiumPrice ? event.premiumPrice : event.price;

    // Check if already registered
    const existingReg = await adminDb.collection("eventRegistrations")
      .where("userId", "==", userId)
      .where("eventId", "==", eventId)
      .limit(1)
      .get();
    if (!existingReg.empty) {
      return NextResponse.json({ success: false, message: "Already registered." }, { status: 409 });
    }

    // Create order
    const order = await createRazorpayOrder({
      amount,
      currency: "INR",
      receipt: `evt_${eventId}_${userId.slice(0, 8)}`,
      notes: {
        eventId,
        userId,
        eventTitle: event.title,
      },
    });

    // Store pending payment record
    await adminDb.collection("payments").doc(order.id).set({
      orderId: order.id,
      eventId,
      eventTitle: event.title,
      userId,
      amount,
      currency: "INR",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: user.fullName || "",
        email: user.email || "",
        contact: user.phone || "",
      },
    });
  } catch (error: any) {
    console.error("[POST /api/v1/payments/create-order]", error);
    return NextResponse.json({ success: false, message: "Could not create payment order.", error: error.message }, { status: 500 });
  }
}
