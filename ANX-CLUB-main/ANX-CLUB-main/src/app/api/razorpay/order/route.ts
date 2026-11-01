import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', userId = '', email = '', purpose = 'Payment', eventId = '', name = '', college = '', mobile = '', teamName = '', teamMembers = '' } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const options = {
      amount: Math.round(amount * 100), 
      currency,
      receipt: `rcptid_${Date.now()}`,
      notes: {
        userId,
        email,
        purpose,
        eventId,
        name: name.substring(0, 255),
        college: college.substring(0, 255),
        mobile: mobile.substring(0, 255),
        teamName: teamName.substring(0, 255),
        teamMembers: teamMembers.substring(0, 255)
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return NextResponse.json({ error: error.message || 'Error creating order' }, { status: 500 });
  }
}
