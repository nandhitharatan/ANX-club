import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';
import { getNormalizedLifecycleStatus } from '@/lib/events/lifecycle';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isUserAdmin = userData?.role?.toLowerCase() === "admin" ||
                        userData?.email?.toLowerCase() === "admin@algorithmaliens.com" ||
                        userData?.email?.toLowerCase() === "admin@anx.club" ||
                        userData?.email?.toLowerCase() === "admin@algoritmaliens.com" ||
                        userId === "admin_user" ||
                        userId === "admin_anx_core";
    if (!isUserAdmin) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Forbidden: Administrator role required" } }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const lastId = searchParams.get("lastId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    let queryRef: any = adminDb.collection('events').orderBy(sortBy, sortOrder).limit(limit);

    if (lastId) {
      const lastDoc = await adminDb.collection("events").doc(lastId).get();
      if (lastDoc.exists) {
        queryRef = queryRef.startAfter(lastDoc);
      }
    }

    const eventsSnapshot = await queryRef.get();
    const events = eventsSnapshot.docs.map((doc: any) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        ...data,
        normalizedStatus: getNormalizedLifecycleStatus({ id: doc.id, ...data }),
      };
    });

    const response = NextResponse.json(events);
    
    // Admin routes generally shouldn't be heavily cached, but a small cache avoids spam
    response.headers.set("Cache-Control", "private, max-age=10");

    return response;
  } catch (error: any) {
    console.error('Error fetching admin events:', error);
    return NextResponse.json({ error: error.message || 'Error fetching events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticate(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isUserAdmin = userData?.role?.toLowerCase() === "admin" ||
                        userData?.email?.toLowerCase() === "admin@algorithmaliens.com" ||
                        userData?.email?.toLowerCase() === "admin@anx.club" ||
                        userData?.email?.toLowerCase() === "admin@algoritmaliens.com" ||
                        userId === "admin_user" ||
                        userId === "admin_anx_core";
    if (!isUserAdmin) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Forbidden: Administrator role required" } }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, date, type, price, premiumPrice, memberOnly, speaker, seats, imageUrl } = body;

    if (!title || !date || !type || !seats) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventData = {
      title,
      description: description || '',
      date,
      type,
      price: Number(price) || 0,
      premiumPrice: Number(premiumPrice) || 0,
      memberOnly: Boolean(memberOnly),
      speaker: speaker || '',
      seats: Number(seats) || 0,
      registeredCount: 0,
      imageUrl: imageUrl || '',
      status: 'Approved', // Admin created events are automatically approved
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('events').add(eventData);

    return NextResponse.json({ id: docRef.id, ...eventData }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message || 'Error creating event' }, { status: 500 });
  }
}
