import { createClient } from "@/lib/supabase/server";

interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number;
}

// Use Postgres function for atomic rate limiting to prevent race conditions
export async function rateLimit(key: string, limit: number, windowSeconds: number, cost: number = 1): Promise<RateLimitResult> {
    const supabase = await createClient();

    // Call the atomic RPC function
    const { data, error } = await supabase.rpc('check_rate_limit', {
        rate_key: key,
        rate_limit: limit,
        window_seconds: windowSeconds,
        cost_val: cost
    });

    if (error) {
        // Fallback to allow if DB fails (fail open) or closed?
        console.error("Rate limit RPC error:", error);
        // FAIL OPEN: If rate limit check fails, allow the request to proceed.
        // This prevents DB errors from blocking legitimate users.
        return { success: true, remaining: 1, reset: Date.now() + 60000 };
    }

    if (data) {
        let resetMs = Date.now() + 60000;
        if (data.reset_time) {
            const parsed = new Date(data.reset_time).getTime();
            if (!isNaN(parsed)) {
                resetMs = parsed;
            }
        }

        return {
            success: data.success,
            remaining: data.remaining,
            reset: resetMs
        };
    }

    return { success: false, remaining: 0, reset: Date.now() + 60000 };
}

