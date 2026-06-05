import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'maven_super_secure_secret_2026';

// Helper to hash password using SHA-256 and salt
export function hashPassword(password: string): string {
  const salt = 'maven_salt_2026_!';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
}

// Generate a simple secure signed JSON Web Token (without external dependencies)
export function generateToken(userId: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Token expires in 7 days
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = Buffer.from(JSON.stringify({ userId, email, exp })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  return `${header}.${payload}.${signature}`;
}

// Verify simple secure signed token
export function verifyToken(token: string): TokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [header, payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  if (signature !== expectedSignature) return null;
  
  try {
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenPayload;
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decodedPayload;
  } catch {
    return null;
  }
}

// Extract authenticated user from request cookie or Authorization header (Server side)
export async function getUserFromRequest(): Promise<{ id: string; email: string } | null> {
  let token = '';

  // 1. Try to extract token from Authorization header (Bearer token)
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  } catch (err) {
    console.error('Failed to read Authorization header:', err);
  }

  // 2. Fallback to cookie
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('maven_session')?.value || '';
    } catch (err) {
      console.error('Failed to read cookies:', err);
    }
  }

  if (!token) return null;
  
  // 1. Try to verify via Supabase Auth
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      return { id: user.id, email: user.email || '' };
    }
  } catch (err) {
    console.error('Supabase token verification failed, trying fallback:', err);
  }

  // 2. Fallback to custom JWT
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return { id: payload.userId, email: payload.email };
}
