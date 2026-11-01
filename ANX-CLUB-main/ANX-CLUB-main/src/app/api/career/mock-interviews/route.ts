import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, date, experience } = body;

    // Logic to save mock interview request and potentially deduct XP
    
    return NextResponse.json({
      success: true,
      message: 'Mock interview scheduled successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to schedule mock interview' }, { status: 500 });
  }
}
