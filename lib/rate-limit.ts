import { createClient } from "@/lib/supabase/server";

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ success: boolean; remaining: number }> {
    const supabase = await createClient();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    const { data: existing } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .gte('expires_at', now.toISOString())
        .single();

    if (existing) {
        if (existing.count >= limit) {
            return { success: false, remaining: 0 };
        }
        const { error } = await supabase
            .from('rate_limits')
            .update({ count: existing.count + 1 })
            .eq('id', existing.id);

        return { success: true, remaining: limit - (existing.count + 1) };
    } else {
        const { error } = await supabase
            .from('rate_limits')
            .insert({
                key,
                count: 1,
                expires_at: expiresAt.toISOString()
            });

        return { success: true, remaining: limit - 1 };
    }
}
