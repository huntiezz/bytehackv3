import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

// Rate limits for token generation
const TOKEN_RATE_LIMITS = {
  IP_LIMIT: 15, // 15 tokens per IP per hour (allows some legitimate retries)
  IP_WINDOW: 3600, // 1 hour
  USER_LIMIT: 20, // 20 tokens per user per hour
  USER_WINDOW: 3600,
  BURST_LIMIT: 5, // Max 5 tokens per 5 minutes (prevents rapid spam)
  BURST_WINDOW: 300, // 5 minutes
};

// Helper function to generate HMAC-SHA256 using Web Crypto API
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

// Generate a cryptographically secure token for post creation
// Each token is unique, signed, and can only be used once
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIp = getClientIp(req);

    // LAYER 1: IP-based rate limiting for token generation
    const ipRateLimit = await rateLimit(
      `token:ip:${clientIp}`,
      TOKEN_RATE_LIMITS.IP_LIMIT,
      TOKEN_RATE_LIMITS.IP_WINDOW
    );

    if (!ipRateLimit.success) {
      const resetTime = Math.ceil((ipRateLimit.reset - Date.now()) / 1000 / 60);
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

    // LAYER 2: User-based rate limiting for token generation
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

    // LAYER 3: Burst protection for token generation
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
    
    // Generate random nonce using Web Crypto API (Edge runtime compatible)
    const nonceArray = new Uint8Array(16);
    crypto.getRandomValues(nonceArray);
    const nonce = Array.from(nonceArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create a payload that includes user ID, IP, timestamp, and nonce
    const payload = `${user.id}:${clientIp}:${timestamp}:${nonce}`;
    
    // Sign the payload with HMAC-SHA256 using Web Crypto API
    const secret = process.env.POST_TOKEN_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "fallback-secret";
    const signature = await generateHMAC(payload, secret);
    
    // Token format: timestamp:nonce:signature
    const token = `${timestamp}:${nonce}:${signature}`;
    
    // Store the nonce in database to prevent reuse (with 10 minute expiration)
    const supabase = await createClient();
    const expiresAt = new Date(timestamp + 600000).toISOString(); // 10 minutes
    
    await supabase.from("post_tokens").insert({
      user_id: user.id,
      nonce: nonce,
      ip_address: clientIp,
      expires_at: expiresAt,
      used: false,
    });
    
    // Clean up expired tokens (older than 10 minutes)
    await supabase
      .from("post_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());
    
    return NextResponse.json({ 
      token,
      expiresAt: timestamp + 600000, // 10 minutes from now
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

