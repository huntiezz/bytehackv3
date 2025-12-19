import { createClient } from "@/lib/supabase/server";

interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number, cost: number = 1): Promise<RateLimitResult> {
    const supabase = await createClient();
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const { data: bucket, error: fetchError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        return { success: true, remaining: 1, reset: now + windowMs };
    }

    let tokens = limit;
    let lastRefill = now;

    if (bucket) {
        const timePassed = now - new Date(bucket.last_refill).getTime();
        const tokensToAdd = Math.floor(timePassed * (limit / windowMs));

        tokens = Math.min(limit, bucket.tokens + tokensToAdd);
        lastRefill = bucket.last_refill;
    }

    if (bucket && new Date(bucket.expires_at).getTime() > now) {
        if (bucket.count + cost > limit) {
            return {
                success: false,
                remaining: 0,
                reset: new Date(bucket.expires_at).getTime()
            };
        }

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
        const expiresAt = new Date(now + windowMs).toISOString();

        const { error: upsertError } = await supabase
            .from('rate_limits')
            .upsert({
                key,
                count: cost,
                expires_at: expiresAt,
            }, { onConflict: 'key' });

        return {
            success: true,
            remaining: limit - cost,
            reset: now + windowMs
        };
    }
}

