import { NextRequest, NextResponse } from 'next/server';
import { getUserByIdOrEmail } from '@/modules/module2/data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false, error: 'Email is required' }, { status: 400 });
    }

    const record = getUserByIdOrEmail(email);

    if (record) {
      return NextResponse.json({
        exists: true,
        user: {
          id: record.id,
          name: record.user.name,
          email: record.user.email,
          role: record.user.role
        }
      });
    }

    return NextResponse.json({ exists: false, error: 'Invalid email. Please try again.' }, { status: 404 });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({ exists: false, error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ exists: false, error: 'Email is required' }, { status: 400 });
    }

    const record = getUserByIdOrEmail(email);

    if (record) {
      return NextResponse.json({
        exists: true,
        user: {
          id: record.id,
          name: record.user.name,
          email: record.user.email,
          role: record.user.role
        }
      });
    }

    return NextResponse.json({ exists: false, error: 'Invalid email. Please try again.' }, { status: 404 });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({ exists: false, error: 'Authentication failed' }, { status: 500 });
  }
}
