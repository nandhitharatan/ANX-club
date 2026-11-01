import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No OAuth code provided' }, { status: 400 });
  }

  // Logic: 
  // 1. Exchange code for Discord access token
  // 2. Fetch Discord User ID
  // 3. Look up user's roles in A.N.X Firestore
  // 4. Assign roles via Discord Bot API

  // Redirect to success page or dashboard
  return NextResponse.redirect(new URL('/dashboard?discord=success', request.url));
}
