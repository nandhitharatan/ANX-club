import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, company, description } = body;

    // Here we would typically save this to the database (Firestore)
    
    return NextResponse.json({
      success: true,
      message: 'Job posted successfully',
      job: { id: Date.now().toString(), title, company, description }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to post job' }, { status: 500 });
  }
}
