import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Normalize email
    const cleanEmail = email.toLowerCase().trim();

    // 1. Sign up user via Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: signUpError.status || 400 });
    }

    const supabaseUser = signUpData.user;
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
    }

    // 2. Synchronize/save user record in the local Prisma DB
    // Use upsert to handle case where user record might already exist
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: name || 'Trader',
      },
      create: {
        id: supabaseUser.id, // Synchronize the ID with Supabase Auth UUID
        email: cleanEmail,
        name: name || 'Trader',
      },
    });

    // 3. Extract the access token for session management
    const accessToken = signUpData.session?.access_token || '';

    // Set cookie response
    const response = NextResponse.json({
      success: true,
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
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An error occurred during registration.' }, { status: 500 });
  }
}
