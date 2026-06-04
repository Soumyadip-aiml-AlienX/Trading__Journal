import crypto from 'node:crypto';
import { cookies } from 'next/headers';

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

// Extract authenticated user from request cookie (Server side)
export async function getUserFromRequest(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('maven_session')?.value;
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return { id: payload.userId, email: payload.email };
}
