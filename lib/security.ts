import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export function sanitizeUserData(user: any) {
  if (!user) return null;

  const { email, ...safeUser } = user;
  return safeUser;
}

export function sanitizeProfile(profile: any, currentUserId?: string) {
  if (!profile) return null;

  const sanitized = { ...profile };

  if (profile.id !== currentUserId) {
    delete sanitized.email;
  }

  return sanitized;
}

export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (cfIp) {
    return cfIp.trim();
  }

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000);
}

export function validateContentLength(content: string, maxLength: number = 10000): boolean {
  return content.length <= maxLength;
}
