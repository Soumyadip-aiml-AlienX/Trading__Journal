import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.ADMIN_EMAIL || 'demo@maven.com';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (email === expectedEmail && password === expectedPassword) {
      return NextResponse.json({ 
        success: true,
        userName: 'Prop Trader Pro',
        email: expectedEmail
      });
    }

    return NextResponse.json(
      { error: 'Invalid email or password. Use your configured credentials.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
