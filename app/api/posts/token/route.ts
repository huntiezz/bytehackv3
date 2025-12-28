import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const TOKEN_RATE_LIMITS = {
  IP_LIMIT: 15,
  IP_WINDOW: 3600,
  USER_LIMIT: 20,
  USER_WINDOW: 3600,
  BURST_LIMIT: 5,
  BURST_WINDOW: 300,
};

async function generateHMAC(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIp = getClientIp(req);

    const ipRateLimit = await rateLimit(
      `token:ip:${clientIp}`,
      TOKEN_RATE_LIMITS.IP_LIMIT,
      TOKEN_RATE_LIMITS.IP_WINDOW
    );

    if (!ipRateLimit.success) {
      const resetTime = Math.max(1, Math.ceil((ipRateLimit.reset - Date.now()) / 1000 / 60));
      return NextResponse.json(
        {
          error: `Too many token requests from this IP. Please try again in ${resetTime} minutes.`,
          retryAfter: ipRateLimit.reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((ipRateLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(TOKEN_RATE_LIMITS.IP_LIMIT),
            'X-RateLimit-Remaining': String(ipRateLimit.remaining),
            'X-RateLimit-Reset': String(ipRateLimit.reset),
          }
        }
      );
    }

    const userRateLimit = await rateLimit(
      `token:user:${user.id}`,
      TOKEN_RATE_LIMITS.USER_LIMIT,
      TOKEN_RATE_LIMITS.USER_WINDOW
    );

    if (!userRateLimit.success) {
      const resetTime = Math.ceil((userRateLimit.reset - Date.now()) / 1000 / 60);
      return NextResponse.json(
        {
          error: `You're requesting tokens too quickly. Please wait ${resetTime} minutes.`,
          retryAfter: userRateLimit.reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((userRateLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(TOKEN_RATE_LIMITS.USER_LIMIT),
            'X-RateLimit-Remaining': String(userRateLimit.remaining),
            'X-RateLimit-Reset': String(userRateLimit.reset),
          }
        }
      );
    }

    const burstLimit = await rateLimit(
      `token:burst:${user.id}`,
      TOKEN_RATE_LIMITS.BURST_LIMIT,
      TOKEN_RATE_LIMITS.BURST_WINDOW
    );

    if (!burstLimit.success) {
      const resetTime = Math.ceil((burstLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Slow down! Wait ${resetTime} seconds before requesting another token.`,
          retryAfter: burstLimit.reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((burstLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(TOKEN_RATE_LIMITS.BURST_LIMIT),
            'X-RateLimit-Remaining': String(burstLimit.remaining),
            'X-RateLimit-Reset': String(burstLimit.reset),
          }
        }
      );
    }

    const timestamp = Date.now();

    const nonceArray = new Uint8Array(16);
    crypto.getRandomValues(nonceArray);
    const nonce = Array.from(nonceArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const payload = `${user.id}:${clientIp}:${timestamp}:${nonce}`;

    const secret = process.env.POST_TOKEN_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "fallback-secret";
    const signature = await generateHMAC(payload, secret);

    const token = `${timestamp}:${nonce}:${signature}`;

    const supabase = await createClient();
    const expiresAt = new Date(timestamp + 600000).toISOString();

    const { error } = await supabase.from("post_tokens").insert({
      user_id: user.id,
      nonce: nonce,
      ip_address: clientIp,
      expires_at: expiresAt,
      used: false,
    });

    // Purging old tokens could be done separately or here.
    await supabase
      .from("post_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());

    return NextResponse.json({
      token,
      expiresAt: timestamp + 600000,
      rateLimit: {
        remaining: Math.min(ipRateLimit.remaining, userRateLimit.remaining, burstLimit.remaining),
        reset: Math.max(ipRateLimit.reset, userRateLimit.reset, burstLimit.reset),
      }
    });

  } catch (error) {
    console.error("Error generating post token:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
