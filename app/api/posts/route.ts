import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, addSecurityHeaders, sanitizeInput } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

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

// Security configuration for post creation
const POST_RATE_LIMITS = {
  IP_LIMIT: 1000,
  IP_WINDOW: 3600,
  USER_LIMIT: 1000,
  USER_WINDOW: 3600,
  BURST_LIMIT: 50,
  BURST_WINDOW: 10,
};

export async function POST(req: NextRequest) {
  try {
    // Get user and IP for multi-layer rate limiting
    const user = await getCurrentUser();
    const clientIp = getClientIp(req);

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to post" }, { status: 401 });
    }

    // LAYER 1: IP-based rate limiting (prevents VPN/proxy spam)
    const ipRateLimit = await rateLimit(
      `post:ip:${clientIp}`,
      POST_RATE_LIMITS.IP_LIMIT,
      POST_RATE_LIMITS.IP_WINDOW
    );

    if (!ipRateLimit.success) {
      const resetTime = Math.ceil((ipRateLimit.reset - Date.now()) / 1000 / 60) || 1;
      return NextResponse.json(
        {
          error: `Too many posts from this IP address. Please try again in ${resetTime} minutes.`,
          retryAfter: ipRateLimit.reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((ipRateLimit.reset - Date.now()) / 1000) || 60),
            'X-RateLimit-Limit': String(POST_RATE_LIMITS.IP_LIMIT),
            'X-RateLimit-Remaining': String(ipRateLimit.remaining),
            'X-RateLimit-Reset': String(ipRateLimit.reset),
          }
        }
      );
    }

    // LAYER 2: User-based rate limiting (prevents account spam)
    const userRateLimit = await rateLimit(
      `post:user:${user.id}`,
      POST_RATE_LIMITS.USER_LIMIT,
      POST_RATE_LIMITS.USER_WINDOW
    );

    if (!userRateLimit.success) {
      const resetTime = Math.ceil((userRateLimit.reset - Date.now()) / 1000 / 60) || 1;
      return NextResponse.json(
        {
          error: `You're posting too quickly. Please wait ${resetTime} minutes before posting again.`,
          retryAfter: userRateLimit.reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((userRateLimit.reset - Date.now()) / 1000) || 60),
            'X-RateLimit-Limit': String(POST_RATE_LIMITS.USER_LIMIT),
            'X-RateLimit-Remaining': String(userRateLimit.remaining),
            'X-RateLimit-Reset': String(userRateLimit.reset),
          }
        }
      );
    }

    // LAYER 3: Burst protection (prevents rapid successive posts)
    const burstLimit = await rateLimit(
      `post:burst:${user.id}`,
      POST_RATE_LIMITS.BURST_LIMIT,
      POST_RATE_LIMITS.BURST_WINDOW
    );

    if (!burstLimit.success) {
      const resetTime = Math.ceil((burstLimit.reset - Date.now()) / 1000) || 10;
      return NextResponse.json(
        {
          error: `Please slow down! Wait ${resetTime} seconds before posting again.`,
          retryAfter: burstLimit.reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((burstLimit.reset - Date.now()) / 1000) || 10),
            'X-RateLimit-Limit': String(POST_RATE_LIMITS.BURST_LIMIT),
            'X-RateLimit-Remaining': String(burstLimit.remaining),
            'X-RateLimit-Reset': String(burstLimit.reset),
          }
        }
      );
    }

    // LAYER 4: Cryptographic token validation (prevents automated scripts)
    const { title, content, category } = await req.json();

    // SECURITY TOKEN CHECK DISABLED AT USER REQUEST
    // if (!securityToken) { ... }

    /* 
    if (!securityToken) {
      return NextResponse.json({ error: "Invalid request - missing security token" }, { status: 403 });
    }
    // ... rest of token validation ...
    */

    // Skip validating token signature, expiry, and reuse.
    // Proceed directly to basic validation.

    const supabase = await createClient();

    // Basic validation
    if (!title || !content || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json({ error: "Title cannot exceed 100 characters." }, { status: 400 });
    }

    if (content.length > 20000) {
      return NextResponse.json({ error: "Post content cannot exceed 20000 characters." }, { status: 400 });
    }

    // LAYER 5: Check for duplicate content (prevents copy-paste spam)
    const contentHash = await hashContent(content);

    const { data: recentPosts } = await supabase
      .from("threads")
      .select("id")
      .eq("author_id", user.id)
      .gte("created_at", new Date(Date.now() - 3600000).toISOString()) // Last hour
      .limit(10);

    if (recentPosts && recentPosts.length > 0) {
      // Check if user posted identical content recently
      const { data: duplicates } = await supabase
        .from("threads")
        .select("id")
        .eq("author_id", user.id)
        .eq("body", content)
        .gte("created_at", new Date(Date.now() - 3600000).toISOString())
        .limit(1);

      if (duplicates && duplicates.length > 0) {
        return NextResponse.json(
          { error: "You've already posted this content recently. Please create unique posts." },
          { status: 409 }
        );
      }
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedContent = sanitizeInput(content);

    const { checkCategoryPermission } = await import("@/lib/forum-permissions");
    const hasPermission = await checkCategoryPermission(user.id, category);

    if (!hasPermission) {
      return NextResponse.json({ error: "You do not have permission to post in this category." }, { status: 403 });
    }

    // LAYER 6: Final check - ensure user is not banned
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) {
      return NextResponse.json({ error: "Your account is banned from posting." }, { status: 403 });
    }

    // Create the post
    const { data, error } = await supabase
      .from("threads")
      .insert({
        title: sanitizedTitle,
        body: sanitizedContent,
        category,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add security headers to response
    let response = NextResponse.json(data);
    response = addSecurityHeaders(response);

    return response;
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// Simple content hash for duplicate detection
async function hashContent(content: string): Promise<string> {
  const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
  return Buffer.from(normalized).toString('base64').slice(0, 50);
}
