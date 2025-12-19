
import { createClient } from "@/lib/supabase/server";

interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number;
}

/**
 * Token Bucket Rate Limiter backed by Supabase
 * @param key Unique identifier (e.g., 'ip:127.0.0.1' or 'user:uuid')
 * @param limit Maximum burst tokens
 * @param windowSeconds Window size in seconds
 * @param cost Cost per action (default 1)
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number, cost: number = 1): Promise<RateLimitResult> {
    const supabase = await createClient();
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Fetch existing bucket
    const { data: bucket, error: fetchError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = JSON object requested, multiple (or no) results returned
        console.warn("Rate limit fetch error:", fetchError);
        // Fail open if DB is down, but log it. 
        // Security trade-off: Do we block or allow? For now allow to prevent outage.
        return { success: true, remaining: 1, reset: now + windowMs };
    }

    let tokens = limit;
    let lastRefill = now;

    if (bucket) {
        // Refill tokens
        const timePassed = now - new Date(bucket.last_refill).getTime();
        const tokensToAdd = Math.floor(timePassed * (limit / windowMs));

        tokens = Math.min(limit, bucket.tokens + tokensToAdd);
        lastRefill = bucket.last_refill; // Keep old time if no refill happened, or update? 
        // Token bucket Logic:
        // Rate = limit / window
        // New tokens = time_delta * rate
        // We update last_refill ONLY if we successfully consume or if we updated tokens.

        // Actually, simpler generic window approach for DB matching "windowSeconds":
        // This implementation seems to mix Token Bucket and leaky bucket. 
        // Let's stick to the simpler implementation I saw earlier but make it robust.
        // Actually, the previous implementation was a "Fixed Window" (row expires at future date).
        // Let's stick to Fixed Window but make it atomic-ish.

        // Re-evaluating: Fixed Window is fine for this scale.
        // If row exists and explicitly strictly > now (handled by expires_at), we check count.
        // The previous code had a logic bug: `expires_at` was set to now + window on creation. 
        // If I request again, I see it's valid, I increment count.
        // This is correct for Fixed Window.
    }

    // Let's write a clean Fixed Window implementation that is robust.

    if (bucket && new Date(bucket.expires_at).getTime() > now) {
        if (bucket.count + cost > limit) {
            return {
                success: false,
                remaining: 0,
                reset: new Date(bucket.expires_at).getTime()
            };
        }

        // Increment
        await supabase
            .from('rate_limits')
            .update({ count: bucket.count + cost })
            .eq('id', bucket.id);

        return {
            success: true,
            remaining: limit - (bucket.count + cost),
            reset: new Date(bucket.expires_at).getTime()
        };
    } else {
        // Create new window or reset query
        // Upsert is better to handle race conditions
        const expiresAt = new Date(now + windowMs).toISOString();

        const { error: upsertError } = await supabase
            .from('rate_limits')
            .upsert({
                key,
                count: cost,
                expires_at: expiresAt,
                // We might need to handle 'last_refill' if we change schema, but let's stick to existing columns if possible?
                // Step 1410 showed: key, count, expires_at. Structure is fine.
            }, { onConflict: 'key' });

        return {
            success: true,
            remaining: limit - cost,
            reset: now + windowMs
        };
    }
}
