import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, name, newPassword } = await request.json();

    if (!email || !name || !newPassword) {
      return NextResponse.json(
        { error: 'Email, Account Name, and New Password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found with this email.' },
        { status: 404 }
      );
    }

    // Verify account name matches (case-insensitive comparison)
    const displayName = user.name || '';
    if (displayName.toLowerCase().trim() !== cleanName.toLowerCase()) {
      return NextResponse.json(
        { error: 'Validation failed. Account display name does not match.' },
        { status: 400 }
      );
    }

    // Update password in Supabase using the admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Supabase admin password update failed:', updateError);
      return NextResponse.json(
        { error: `Password update failed: ${updateError.message}. Ensure SUPABASE_SERVICE_ROLE_KEY is configured in .env.local` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now log in.'
    });
  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during password reset.' },
      { status: 500 }
    );
  }
}
