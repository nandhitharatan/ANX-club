import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { MOCK_EVENTS, MOCK_MENTORS, MOCK_ANNOUNCEMENTS } from "@/lib/constants";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const batch = adminDb.batch();

    // 1. Seed Admin User
    const adminRef = adminDb.collection("users").doc("admin_anx_core");
    batch.set(adminRef, {
      uid: "admin_anx_core",
      email: "admin@anx.club",
      fullName: "System Administrator",
      role: "Admin",
      membershipType: "premium",
      joinedDate: new Date().toISOString(),
      phoneNumber: "+91 9876543210",
      collegeName: "A.N.X Central HQ",
      bio: "Global platform operator and ecosystem administrator.",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // 2. Seed Sample Events
    for (const evt of MOCK_EVENTS as any[]) {
      const eventRef = adminDb.collection("events").doc(evt.id);
      batch.set(eventRef, {
        title: evt.title,
        description: evt.description,
        date: evt.date,
        time: evt.time || "10:00 AM",
        duration: 120,
        venue: evt.venue,
        isOnline: evt.venue?.toLowerCase?.().includes("online") || false,
        category: evt.category,
        eventType: evt.eventType || "workshop",
        price: evt.price || 0,
        premiumPrice: evt.premiumPrice || 0,
        premiumOnly: Boolean(evt.premiumOnly),
        capacity: evt.capacity || 100,
        seatsAvailable: evt.seatsAvailable || 100,
        seatsBooked: evt.seatsBooked || 0,
        registeredCount: evt.registeredCount || 0,
        posterUrl: evt.posterUrl || evt.thumbnail,
        speaker: evt.speaker,
        speakerName: evt.speaker,
        speakerBio: evt.speakerBio || "Industry expert",
        speakerImage: evt.speakerImage,
        isActive: true,
        status: "Approved",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // 3. Seed Sample Mentors
    for (const mentor of MOCK_MENTORS as any[]) {
      const mentorRef = adminDb.collection("mentors").doc(mentor.id);
      batch.set(mentorRef, {
        name: mentor.name,
        role: mentor.role,
        company: mentor.company,
        rating: mentor.rating,
        sessionsCount: mentor.sessionsCount || mentor.sessions || 0,
        avatar: mentor.avatar,
        skills: mentor.skills || [],
        availableTopics: mentor.availableTopics || ["System Design", "Career Growth", "Interview Prep"],
        bio: mentor.bio || "Experienced mentor ready to guide students.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // 4. Seed Sample Announcements
    for (const ann of MOCK_ANNOUNCEMENTS as any[]) {
      const annRef = adminDb.collection("announcements").doc(ann.id);
      batch.set(annRef, {
        title: ann.title,
        content: ann.content,
        date: ann.date || ann.createdAt?.toISOString?.() || new Date().toISOString(),
        type: ann.type || ann.category || "General",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Firestore database seeded successfully with Admin account, Events, Mentors, and Announcements! 🎉",
      adminCredentials: {
        email: "admin@anx.club",
        password: "AdminPass123! (or use 1-click Demo Admin login)",
        role: "Admin",
      }
    });
  } catch (error: any) {
    console.error("[POST /api/v1/admin/seed]", error);
    return NextResponse.json({
      success: false,
      message: "Database seed failed: " + error.message,
    }, { status: 500 });
  }
}
