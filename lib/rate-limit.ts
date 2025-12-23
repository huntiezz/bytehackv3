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
        // Fail open to avoid blocking legit users on DB error, but for security maybe fail closed?
        // User wants MAX security.
        return { success: false, remaining: 0, reset: Date.now() + 60000 };
    }

    if (data) {
        return {
            success: data.success,
            remaining: data.remaining,
            reset: new Date(data.reset_time).getTime()
        };
    }

    return { success: false, remaining: 0, reset: Date.now() };
}

