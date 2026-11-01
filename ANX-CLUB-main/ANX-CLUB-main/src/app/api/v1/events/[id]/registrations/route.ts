import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { authenticate } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id: eventId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const snapshot = await adminDb.collection("eventRegistrations")
      .where("eventId", "==", eventId)
      .get();

    const registrations = snapshot.docs.map((doc: any) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        registeredAt: data.registeredAt?.toDate?.()?.toISOString() || data.registeredAt || null,
      };
    });

    // CSV format export support
    if (format === "csv") {
      const headers = ["S.No", "Name", "Email", "Phone", "Membership", "Payment Status", "Amount", "Payment ID", "Registered At"];
      const rows = registrations.map((r: any, i) => [
        i + 1,
        r.name,
        r.email,
        r.phone,
        r.membershipType,
        r.paymentStatus,
        r.amount,
        r.paymentId || "—",
        r.registeredAt,
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="registrations-${eventId}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error: any) {
    console.error("[GET /api/events/:id/registrations]", error);
    return NextResponse.json({ success: false, message: "Server error.", error: error.message }, { status: 500 });
  }
}
