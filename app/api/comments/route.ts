
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeInput, getClientIp } from "@/lib/security";

// Comment validation constants
const COMMENT_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 2000,
};

// Comment rate limits
const COMMENT_RATE_LIMITS = {
  IP_LIMIT: 20, // 20 comments per IP per hour
  IP_WINDOW: 3600, // 1 hour
  USER_LIMIT: 30, // 30 comments per user per hour
  USER_WINDOW: 3600,
  BURST_LIMIT: 5, // Max 5 comments per minute (prevents rapid spam)
  BURST_WINDOW: 60, // 1 minute
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to comment" }, { status: 401 });
    }

    const clientIp = getClientIp(req);

    // LAYER 1: IP-based rate limiting
    const ipRateLimit = await rateLimit(
      `comment:ip:${clientIp}`,
      COMMENT_RATE_LIMITS.IP_LIMIT,
      COMMENT_RATE_LIMITS.IP_WINDOW
    );

    if (!ipRateLimit.success) {
      const resetTime = Math.ceil((ipRateLimit.reset - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { 
          error: `Too many comments from this IP. Please try again in ${resetTime} minutes.`,
          retryAfter: ipRateLimit.reset 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((ipRateLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(COMMENT_RATE_LIMITS.IP_LIMIT),
            'X-RateLimit-Remaining': String(ipRateLimit.remaining),
            'X-RateLimit-Reset': String(ipRateLimit.reset),
          }
        }
      );
    }

    // LAYER 2: User-based rate limiting
    const userRateLimit = await rateLimit(
      `comment:user:${user.id}`,
      COMMENT_RATE_LIMITS.USER_LIMIT,
      COMMENT_RATE_LIMITS.USER_WINDOW
    );

    if (!userRateLimit.success) {
      const resetTime = Math.ceil((userRateLimit.reset - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { 
          error: `You're commenting too quickly. Please wait ${resetTime} minutes.`,
          retryAfter: userRateLimit.reset 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((userRateLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(COMMENT_RATE_LIMITS.USER_LIMIT),
            'X-RateLimit-Remaining': String(userRateLimit.remaining),
            'X-RateLimit-Reset': String(userRateLimit.reset),
          }
        }
      );
    }

    // LAYER 3: Burst protection (prevents rapid successive comments)
    const burstLimit = await rateLimit(
      `comment:burst:${user.id}`,
      COMMENT_RATE_LIMITS.BURST_LIMIT,
      COMMENT_RATE_LIMITS.BURST_WINDOW
    );

    if (!burstLimit.success) {
      const resetTime = Math.ceil((burstLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: `Slow down! Wait ${resetTime} seconds before commenting again.`,
          retryAfter: burstLimit.reset 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((burstLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(COMMENT_RATE_LIMITS.BURST_LIMIT),
            'X-RateLimit-Remaining': String(burstLimit.remaining),
            'X-RateLimit-Reset': String(burstLimit.reset),
          }
        }
      );
    }

    const { postId, content, parentCommentId } = await req.json();

    if (!postId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Trim content first
    const trimmedContent = content.trim();

    // Validate minimum length
    if (trimmedContent.length < COMMENT_LIMITS.MIN_LENGTH) {
      return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
    }

    // CRITICAL: Server-side length validation (prevents Burp Suite bypass)
    if (trimmedContent.length > COMMENT_LIMITS.MAX_LENGTH) {
      return NextResponse.json({ 
        error: `Comment cannot exceed ${COMMENT_LIMITS.MAX_LENGTH} characters. Current length: ${trimmedContent.length}` 
      }, { status: 400 });
    }

    // Additional security: Check if someone is trying to send extremely long content
    // Even if they bypass the trim, catch raw content that's too long
    if (content.length > COMMENT_LIMITS.MAX_LENGTH + 1000) {
      return NextResponse.json({ 
        error: "Invalid request - content too large" 
      }, { status: 400 });
    }

    // Sanitize input to prevent XSS
    const sanitizedContent = sanitizeInput(trimmedContent);

    const supabase = await createClient();

    // LAYER 4: Duplicate comment detection (prevents copy-paste spam)
    const { data: recentComments } = await supabase
      .from("thread_replies")
      .select("id, body")
      .eq("author_id", user.id)
      .gte("created_at", new Date(Date.now() - 3600000).toISOString()) // Last hour
      .limit(20);

    if (recentComments && recentComments.length > 0) {
      // Check if user posted identical content recently
      const isDuplicate = recentComments.some(
        (reply) => reply.body.toLowerCase().trim() === sanitizedContent.toLowerCase().trim()
      );

      if (isDuplicate) {
        return NextResponse.json(
          { error: "You've already posted this comment recently. Please create unique comments." },
          { status: 409 }
        );
      }
    }

    // LAYER 5: Check for spam patterns (very short repeated comments)
    if (sanitizedContent.length < 10 && recentComments && recentComments.length >= 3) {
      const shortComments = recentComments.filter(c => c.body.length < 10);
      if (shortComments.length >= 3) {
        return NextResponse.json(
          { error: "Please avoid posting very short comments repeatedly." },
          { status: 429 }
        );
      }
    }

    const { data: comment, error } = await supabase
      .from("thread_replies")
      .insert({
        thread_id: postId,
        body: sanitizedContent,
        author_id: user.id,
        parent_id: parentCommentId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      const { data: post } = await supabase
        .from("threads")
        .select("title, author_id")
        .eq("id", postId)
        .single();

      if (post && post.author_id !== user.id) {
        await createNotification({
          userId: post.author_id,
          actorId: user.id,
          type: 'comment',
          title: 'New Reply',
          message: `${user.username || 'Someone'} replied to your thread "${post.title}"`,
          referenceId: postId,
          referenceUrl: `/forum/${postId}`
        });
      }

      if (parentCommentId) {
        const { data: parentComment } = await supabase
          .from("thread_replies")
          .select("author_id, body")
          .eq("id", parentCommentId)
          .single();

        if (parentComment && parentComment.author_id !== user.id && parentComment.author_id !== post?.author_id) {
          await createNotification({
            userId: parentComment.author_id,
            actorId: user.id,
            type: 'reply',
            title: 'New Reply',
            message: `${user.username || 'Someone'} replied to your comment: "${parentComment.body.substring(0, 30)}..."`,
            referenceId: postId,
            referenceUrl: `/forum/${postId}`
          });
        }
      }

    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIp = getClientIp(req);

    // Rate limiting for deletions
    const deleteRateLimit = await rateLimit(
      `comment:delete:${user.id}`,
      30, // 30 deletions per hour
      3600
    );

    if (!deleteRateLimit.success) {
      const resetTime = Math.ceil((deleteRateLimit.reset - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { error: `Too many deletions. Please try again in ${resetTime} minutes.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: comment } = await supabase
      .from("thread_replies")
      .select("author_id")
      .eq("id", commentId)
      .single();

    if (!comment || comment.author_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("thread_replies")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
