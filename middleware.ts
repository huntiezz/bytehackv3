import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { supabase, response, user } = await updateSession(request);

  if (user) {
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          }
        }
      );

      const { data: banData, error: banError } = await adminClient
        .from('bans')
        .select('reason, expires_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (banError) {
        console.error("Middleware: Ban check error", banError);
      }

      if (banData) {
        console.log("Middleware: Ban found for user", user.id, banData);
        const isExpired = banData.expires_at && new Date(banData.expires_at) < new Date();

        if (!isExpired) {
          console.log("Middleware: Ban active. Redirecting...");
          console.log("Middleware: Ban active. Redirecting...");

          if (!request.nextUrl.pathname.startsWith('/banned') && !request.nextUrl.pathname.startsWith('/api/auth')) {
            const url = request.nextUrl.clone();
            url.pathname = '/banned';
            url.searchParams.set('reason', banData.reason || 'Account Banned');
            return NextResponse.redirect(url);
          }
        } else {
          console.log("Middleware: Ban expired");
        }
      } else {
      }
    } catch (error) {
      console.error("Middleware Supabase ban check failed:", error);
    }
  }



  let deviceId = request.cookies.get('bh_device_id')?.value;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    response.cookies.set({
      name: 'bh_device_id',
      value: deviceId,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      sameSite: 'lax'
    });
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
}
