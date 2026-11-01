import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, referralCount } = body;

    // Logic: If referralCount reaches 3, grant 1 month free
    let rewardGranted = false;
    let message = 'Referral processed successfully';

    if (referralCount >= 3) {
      // In a real scenario, we'd update the user's subscription status in the DB
      rewardGranted = true;
      message = '1 Month Free reward granted!';
    }
    
    return NextResponse.json({
      success: true,
      userId,
      rewardGranted,
      message
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to process referral' }, { status: 500 });
  }
}
