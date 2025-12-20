"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

// Profile comment validation constants
const PROFILE_COMMENT_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 500, // Shorter limit for profile comments
};

// Profile comment rate limits
const PROFILE_COMMENT_RATE_LIMITS = {
  USER_LIMIT: 20, // 20 profile comments per hour
  USER_WINDOW: 3600,
  BURST_LIMIT: 3, // Max 3 profile comments per minute
  BURST_WINDOW: 60,
};

export async function postProfileComment(targetProfileId: string, content: string) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { error: "You must be logged in to comment." };
        }

        // LAYER 1: User-based rate limiting
        const userRateLimit = await rateLimit(
            `profile_comment:user:${user.id}`,
            PROFILE_COMMENT_RATE_LIMITS.USER_LIMIT,
            PROFILE_COMMENT_RATE_LIMITS.USER_WINDOW
        );

        if (!userRateLimit.success) {
            const resetTime = Math.ceil((userRateLimit.reset - Date.now()) / 1000 / 60);
            return { error: `Too many profile comments. Please wait ${resetTime} minutes.` };
        }

        // LAYER 2: Burst protection
        const burstLimit = await rateLimit(
            `profile_comment:burst:${user.id}`,
            PROFILE_COMMENT_RATE_LIMITS.BURST_LIMIT,
            PROFILE_COMMENT_RATE_LIMITS.BURST_WINDOW
        );

        if (!burstLimit.success) {
            const resetTime = Math.ceil((burstLimit.reset - Date.now()) / 1000);
            return { error: `Slow down! Wait ${resetTime} seconds before commenting again.` };
        }

        const trimmedContent = content.trim();

        if (trimmedContent.length < PROFILE_COMMENT_LIMITS.MIN_LENGTH) {
            return { error: "Comment cannot be empty." };
        }

        // CRITICAL: Server-side length validation (prevents Burp Suite bypass)
        if (trimmedContent.length > PROFILE_COMMENT_LIMITS.MAX_LENGTH) {
            return { 
                error: `Comment cannot exceed ${PROFILE_COMMENT_LIMITS.MAX_LENGTH} characters. Current length: ${trimmedContent.length}` 
            };
        }

        // Additional security check
        if (content.length > PROFILE_COMMENT_LIMITS.MAX_LENGTH + 500) {
            return { error: "Invalid request - content too large" };
        }

        // Sanitize input
        const sanitizedContent = sanitizeInput(trimmedContent);

        const supabase = await createClient();

        // LAYER 3: Duplicate comment detection
        const { data: recentComments } = await supabase
            .from("profile_comments")
            .select("content")
            .eq("author_id", user.id)
            .eq("target_profile_id", targetProfileId)
            .gte("created_at", new Date(Date.now() - 3600000).toISOString())
            .limit(10);

        if (recentComments && recentComments.length > 0) {
            const isDuplicate = recentComments.some(
                (c) => c.content.toLowerCase().trim() === sanitizedContent.toLowerCase().trim()
            );

            if (isDuplicate) {
                return { error: "You've already posted this comment recently." };
            }
        }

        const { error } = await supabase
            .from("profile_comments")
            .insert({
                target_profile_id: targetProfileId,
                author_id: user.id,
                content: sanitizedContent,
            });

        if (error) {
            console.error("Error posting comment:", error);
            return { error: "Failed to post comment." };
        }

        revalidatePath(`/${targetProfileId}`);

        return { success: true };
    } catch (error) {
        console.error("Server error:", error);
        return { error: "Internal server error" };
    }
}

export async function getProfileComments(targetProfileId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profile_comments")
        .select(`
            id,
            content,
            created_at,
            author:author_id (
                id,
                username,
                name,
                profile_picture,
                discord_avatar,
                discord_id
            )
        `)
        .eq("target_profile_id", targetProfileId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    return data;
}
