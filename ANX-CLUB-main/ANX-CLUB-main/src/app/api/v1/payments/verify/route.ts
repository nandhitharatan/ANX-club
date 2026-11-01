import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import * as admin from "firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      name,
      email,
      phone,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Signature verification failed" }, { status: 400 });
    }

    const paymentDoc = await adminDb.collection("payments").doc(razorpay_order_id).get();
    if (!paymentDoc.exists || paymentDoc.data()?.userId !== userId) {
      return NextResponse.json({ success: false, message: "Payment order not found." }, { status: 404 });
    }
    const paymentData = paymentDoc.data()!;

    if (paymentData.paymentType === "membership") {
      const startDate = new Date();
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + (paymentData.billingPeriod === "monthly" ? 1 : 12));

      await adminDb.collection("users").doc(userId).set({
        uid: userId,
        membershipType: "premium",
        membershipExpiry: expiry.toISOString(),
        role: "Premium Member",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await paymentDoc.ref.update({
        status: "paid",
        paymentId: razorpay_payment_id,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Write to memberships collection per PRD Section 11
      const membershipRef = adminDb.collection("memberships").doc();
      await membershipRef.set({
        id: membershipRef.id,
        userId,
        memberId: userId,
        plan: paymentData.billingPeriod === "monthly" ? "monthly_149" : "annual_999",
        status: "active",
        startDate: startDate.toISOString(),
        endDate: expiry.toISOString(),
        razorpayPaymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: paymentData.amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send emails
      const targetEmail = email || paymentData.userEmail || "";
      if (targetEmail) {
        try {
          const { sendEmail } = await import("@/lib/resend");
          const { membershipActivationEmail, paymentConfirmationEmail } = await import("@/lib/email-templates");
          await sendEmail(
            targetEmail,
            "A.N.X Premium Membership Activated! 🚀",
            membershipActivationEmail(name || "Member", expiry.toISOString().split('T')[0], paymentData.billingPeriod === "monthly" ? "Monthly Elite" : "Annual Elite")
          );
          await sendEmail(
            targetEmail,
            "Payment Receipt - A.N.X Platform",
            paymentConfirmationEmail(paymentData.amount, razorpay_payment_id, "Premium Membership Subscription")
          );
        } catch (emailErr) {
          console.warn("Membership emails skipped:", emailErr);
        }
      }

      return NextResponse.json({ success: true, message: "Membership upgraded successfully." });
    }

    // Execute atomic transaction for seat booking and registration creation
    const result = await adminDb.runTransaction(async (transaction) => {
      const eventRef = adminDb.collection("events").doc(eventId);
      const paymentRef = adminDb.collection("payments").doc(razorpay_order_id);
      
      const orderRegQuery = adminDb.collection("eventRegistrations")
        .where("orderId", "==", razorpay_order_id)
        .limit(1);
        
      const userRegQuery = adminDb.collection("eventRegistrations")
        .where("eventId", "==", eventId)
        .where("userId", "==", userId)
        .limit(1);

      const [eventDoc, paymentDoc, orderRegSnap, userRegSnap] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(paymentRef),
        transaction.get(orderRegQuery),
        transaction.get(userRegQuery),
      ]);

      if (!eventDoc.exists) throw new Error("EVENT_NOT_FOUND");
      if (!paymentDoc.exists) throw new Error("PAYMENT_NOT_FOUND");

      // Idempotency check: prevent duplicate registration processing for the same order
      if (!orderRegSnap.empty) {
        return { registrationId: orderRegSnap.docs[0].id, idempotent: true };
      }
      
      // Prevent duplicate registration for the same user on the same event
      if (!userRegSnap.empty) {
        throw new Error("USER_ALREADY_REGISTERED");
      }
      
      const paymentData = paymentDoc.data()!;
      if (paymentData.eventId !== eventId) {
        throw new Error("PAYMENT_EVENT_MISMATCH");
      }
      if (paymentData.userId !== userId) {
         throw new Error("PAYMENT_USER_MISMATCH");
      }

      const eventData = eventDoc.data()!;
      if (eventData.isActive === false || eventData.status === "Deleted") {
        throw new Error("EVENT_DELETED");
      }
      if (eventData.status === "Cancelled") {
        throw new Error("EVENT_CANCELLED");
      }
      if (eventData.status === "Draft" || eventData.isPublished === false) {
        throw new Error("EVENT_UNPUBLISHED");
      }
      const seatsAvailable = eventData.seatsAvailable;
      const seatsBooked = eventData.seatsBooked || 0;

      if (seatsAvailable !== null && seatsAvailable !== undefined && seatsBooked >= seatsAvailable) {
        throw new Error("EVENT_SOLD_OUT");
      }

      const regRef = adminDb.collection("eventRegistrations").doc();
      const registrationData = {
        eventId,
        eventTitle: eventData.title,
        userId,
        name: name || "Attendee",
        email: email || "",
        phone: phone || "",
        paymentStatus: "paid",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: paymentData.amount,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "confirmed",
      };

      transaction.set(regRef, registrationData);
      transaction.update(paymentRef, {
        status: "paid",
        paymentId: razorpay_payment_id,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(eventRef, {
        seatsBooked: admin.firestore.FieldValue.increment(1),
        registeredCount: admin.firestore.FieldValue.increment(1),
      });

      return { registrationId: regRef.id, idempotent: false, eventTitle: eventData.title, email: registrationData.email, name: registrationData.name, amount: paymentData.amount };
    });

    if (result && !result.idempotent && result.email) {
      try {
        const { sendEmail } = await import("@/lib/resend");
        const { eventRegistrationEmail, paymentConfirmationEmail } = await import("@/lib/email-templates");
        await sendEmail(
          result.email,
          `Event Registration Confirmed: ${result.eventTitle}`,
          eventRegistrationEmail(result.eventTitle, result.name)
        );
        await sendEmail(
          result.email,
          "Event Payment Receipt - A.N.X Platform",
          paymentConfirmationEmail(result.amount, razorpay_payment_id, `Event: ${result.eventTitle}`)
        );
      } catch (emailErr) {
        console.warn("Event confirmation emails skipped:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and registration confirmed!",
      data: result,
    });
  } catch (error: any) {
    console.error("[POST /api/v1/payments/verify]", error);
    const status =
      error.message === "EVENT_SOLD_OUT"
        ? 409
        : error.message === "EVENT_CANCELLED" || error.message === "EVENT_UNPUBLISHED"
        ? 400
        : error.message === "EVENT_DELETED" || error.message === "EVENT_NOT_FOUND"
        ? 404
        : 500;
    return NextResponse.json(
      { success: false, message: error.message || "Verification failed." },
      { status }
    );
  }
}
