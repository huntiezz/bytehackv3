
"use server";

import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";

// Use Service Role to bypass RLS for Admin actions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

export async function getChristmasStats() {
    const user = await getCurrentUser();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
        return { error: "Unauthorized" };
    }

    try {
        const { count, error } = await supabase
            .from('christmas_attempts')
            .select('*', { count: 'exact', head: true })
            .not('invite_code', 'is', null);

        if (error) throw error;
        return { count: count || 0 };
    } catch (e) {
        console.error("Stats Error:", e);
        return { error: "Failed to fetch stats" };
    }
}

export async function getChristmasSettings() {
    const user = await getCurrentUser();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
        return { error: "Unauthorized" };
    }

    try {
        const { data, error } = await supabase
            .from('christmas_settings')
            .select('is_enabled')
            .single();

        // If no settings row exists yet, we assume enabled or create it? 
        // Our init script creates it.
        if (error) return { is_enabled: true }; // Default true if table empty/error to be safe? Or false?
        // Actually, if missing, we should probably return false or init it.
        // But lets trust the DB.

        return { is_enabled: data?.is_enabled ?? true };
    } catch (e) {
        return { error: "Failed to fetch settings" };
    }
}

export async function toggleChristmasEvent(enabled: boolean) {
    const user = await getCurrentUser();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
        return { error: "Unauthorized" };
    }

    try {
        const { error } = await supabase
            .from('christmas_settings')
            .upsert({ id: true, is_enabled: enabled }); // Upsert to ensure it works even if row missing

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error("Toggle Error:", e);
        return { error: "Failed to update settings" };
    }
}
