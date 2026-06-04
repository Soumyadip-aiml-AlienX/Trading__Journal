import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name || 'Google Trader';

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      // Generate a random password hash for Google-created accounts
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: displayName,
          password: randomPassword
        }
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name }
    });

    response.cookies.set('maven_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Google Auth API error:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google.' }, { status: 500 });
  }
}
