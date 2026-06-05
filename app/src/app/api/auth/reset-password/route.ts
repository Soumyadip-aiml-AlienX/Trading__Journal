import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

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

    // Hash and update password
    const hashedPassword = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

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
