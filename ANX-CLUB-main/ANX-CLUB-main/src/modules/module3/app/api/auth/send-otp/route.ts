import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/fast2sms';
import {adminDb} from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number
    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith('+91')) {
      formattedPhone = formattedPhone.substring(3);
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Firestore with an expiration time (e.g., 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await adminDb.collection('otps').doc(formattedPhone).set({
      otp,
      expiresAt,
      createdAt: new Date(),
    });

    // Send the OTP using Fast2SMS
    const response = await sendOTP(formattedPhone, otp);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // We return the OTP here for development/testing purposes, 
      // but in production, you should NOT return the OTP in the response.
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
