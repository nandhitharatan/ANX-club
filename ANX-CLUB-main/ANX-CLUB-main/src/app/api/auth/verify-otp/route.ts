import { NextResponse } from 'next/server';
import {adminDb} from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Format phone number
    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith('+91')) {
      formattedPhone = formattedPhone.substring(3);
    }

    const otpDocRef = adminDb.collection('otps').doc(formattedPhone);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const data = otpDoc.data();
    
    if (data?.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 });
    }

    const now = new Date();
    if (data?.expiresAt.toDate() < now) {
      // OTP expired
      await otpDocRef.delete();
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // OTP is valid
    // Delete it so it can't be used again
    await otpDocRef.delete();

    return NextResponse.json({ success: true, message: 'OTP verified successfully' });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
