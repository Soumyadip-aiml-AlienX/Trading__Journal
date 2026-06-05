import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Sign in via Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: signInError.status || 401 });
    }

    const supabaseUser = signInData.user;
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Authentication succeeded but no user data returned.' }, { status: 500 });
    }

    // 2. Find or create the user in the local Prisma DB
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {},
      create: {
        id: supabaseUser.id, // Keep the same UUID!
        email: cleanEmail,
        name: supabaseUser.user_metadata?.name || 'Trader',
      },
    });

    // 3. Extract access token
    const accessToken = signInData.session?.access_token || '';

    // Set cookie
    const response = NextResponse.json({
      success: true,
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name }
    });

    if (accessToken) {
      response.cookies.set('maven_session', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });
    }

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'An unexpected authentication error occurred.' }, { status: 500 });
  }
}
