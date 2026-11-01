import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getMemoryRoadmaps } from '@/lib/memory-store';
import * as admin from 'firebase-admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';

export async function POST(request: Request) {
  try {
    const verifiedUser = await verifyAuthToken(request);
    const userEmail = (verifiedUser?.email || '').toLowerCase().trim();
    const isAdmin = verifiedUser?.role === 'Admin' || 
                    userEmail === 'admin@anxclub.dev' ||
                    userEmail === 'admin@algorithmaliens.com' || 
                    userEmail === 'admin@anx.club' ||
                    userEmail === 'admin@algoritmaliens.com' ||
                    verifiedUser?.uid === 'admin_user' ||
                    verifiedUser?.uid === 'admin_anx_core';
    if (!verifiedUser || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }
    const body = await request.json();
    const { track, stepName, url, isMandatory } = body;

    if (!track || !stepName) {
      return NextResponse.json({ success: false, message: 'Track and step name are required' }, { status: 400 });
    }

    const stepId = `step_${Date.now()}`;
    const newStep = {
      id: stepId,
      track,
      stepName,
      url: url || '#',
      isMandatory: Boolean(isMandatory),
      createdAt: new Date().toISOString()
    };

    try {
      await adminDb.collection('curriculum').doc(stepId).set({
        ...newStep,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (e: any) {
      console.warn('Curriculum Firestore save fallback:', e?.message || e);
    }

    // Also update any matching roadmap in memory store
    const roadmaps = getMemoryRoadmaps();
    const matchingRoadmap = roadmaps.find(r => r.title.toLowerCase().includes(track.toLowerCase()) || (r.category && r.category.toLowerCase().includes(track.toLowerCase())));
    if (matchingRoadmap) {
      matchingRoadmap.steps = matchingRoadmap.steps || [];
      matchingRoadmap.steps.push({
        id: stepId,
        title: stepName,
        description: `Resource: ${url || 'Community Guide'}`,
        url: url || '#'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Curriculum step added successfully',
      data: newStep
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to update curriculum' }, { status: 500 });
  }
}
