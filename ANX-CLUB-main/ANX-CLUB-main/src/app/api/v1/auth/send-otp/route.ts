import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/fast2sms';
import { adminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';

// In-memory rate limiting store for OTP dispatches
const otpRateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit = 3, windowSecs = 60): boolean {
  const now = Date.now();
  const record = otpRateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    otpRateLimitStore.set(key, { count: 1, resetTime: now + windowSecs * 1000 });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Phone number is required" } }, { status: 400 });
    }

    const formattedPhone = phoneNumber.replace(/^\+91/, '');
    const rateLimitKey = `rate-limit:otp:${ip}:${formattedPhone}`;

    const isAllowed = checkRateLimit(rateLimitKey);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many OTP requests. Please wait 1 minute before retrying." } },
        { status: 429 }
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await adminDb.collection('otps').doc(formattedPhone).set({
      otpHash: hashedOtp,
      expiresAt,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 5
    });

    await sendOTP(formattedPhone, otp);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to send OTP" } }, 
      { status: 500 }
    );
  }
}
