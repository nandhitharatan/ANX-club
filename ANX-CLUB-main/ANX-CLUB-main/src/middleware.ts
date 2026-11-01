import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  const isPublicGet = request.method === 'GET' && (
    path === '/api/v1/events' ||
    path.startsWith('/api/v1/events/') ||
    path === '/api/v1/mentors' ||
    path.startsWith('/api/v1/mentors/') ||
    path === '/api/v1/community' ||
    path === '/api/v1/resources' ||
    path.startsWith('/api/v1/resources/') ||
    path === '/api/career/resume-review' ||
    path.startsWith('/api/roadmaps') ||
    path.startsWith('/api/events') ||
    path.startsWith('/api/mentors') ||
    path.startsWith('/api/announcements')
  );

  const isPublicAuth = path.startsWith('/api/v1/auth') || path.startsWith('/api/auth');
  const isAISearch = path.startsWith('/api/v1/ai-search') || path.startsWith('/api/ai-search');
  const isPayment = path.startsWith('/api/v1/payments') || path.startsWith('/api/razorpay');

  if (isPublicGet || isPublicAuth || isAISearch || isPayment) {
    return NextResponse.next();
  }

  let token = '';
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1]?.trim();
  } else {
    const sessionCookie = request.cookies.get('session') || request.cookies.get('__session') || request.cookies.get('anx_admin');
    if (sessionCookie) token = sessionCookie.value?.trim();
  }

  if (!token) {
    return NextResponse.next();
  }

  const tokenLower = token.toLowerCase();
  // Handle custom tokens / admin sessions / mock tokens / user IDs
  if (
    tokenLower.startsWith('mock_') ||
    tokenLower.startsWith('session_') ||
    tokenLower.startsWith('demo-token-') ||
    tokenLower.startsWith('usr_') ||
    tokenLower.startsWith('admin_') ||
    tokenLower.includes('admin') ||
    tokenLower.includes('@') ||
    token.split('.').length !== 3
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', token);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  try {
    const payload = jose.decodeJwt(token);
    const userId = payload.sub || payload.uid || (payload as any).user_id;

    const requestHeaders = new Headers(request.headers);
    if (userId) {
      requestHeaders.set('x-user-id', String(userId));
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    // If decoding fails, continue to route handler where authenticate() handles it gracefully
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/api/v1/:path*', 
    '/api/incubation/:path*', 
    '/api/certificates/:path*', 
    '/api/cron/:path*', 
    '/api/gamification/:path*', 
    '/api/internships/:path*', 
    '/api/referrals/:path*', 
    '/api/career/:path*', 
    '/api/partners/:path*', 
    '/api/discord/:path*'
  ],
};
