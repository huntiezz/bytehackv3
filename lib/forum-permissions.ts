import { createClient } from "@/lib/supabase/server";

export async function checkCategoryPermission(userId: string, category: string): Promise<boolean> {
    const supabase = await createClient();

    const PUBLIC_CATEGORIES = [
        "General Discussion", "general-discussion",
        "Coding Discussion", "coding-discussion",
        "Cheat Discussion", "cheat-discussion",
        "anticheat", "anticheat:ac-analysis", "anticheat:bypasses",
        "game:roblox-lua",
        "tutorials:beginner-guides", "tutorials:advanced-techniques",
        "tool:funcaptcha",
        "CS2", "Fortnite", "FiveM", "Rust", "Minecraft",
        "Coding", "Cheats", "SDK", "Game Reversal", "Offsets", "Spoofer", "Custom"
    ];

    if (PUBLIC_CATEGORIES.includes(category)) return true;

    const { data } = await supabase
        .from('forum_category_permissions')
        .select('user_id')
        .eq('user_id', userId)
        .eq('category', category)
        .single();

    return !!data;
}

export async function getUserAllowedCategories(userId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data: permissions } = await supabase
        .from('forum_category_permissions')
        .select('category')
        .eq('user_id', userId);

    const allowed = permissions?.map(p => p.category) || [];

    const PUBLIC_CATEGORIES = [
        "General Discussion", "general-discussion",
        "Coding Discussion", "coding-discussion",
        "Cheat Discussion", "cheat-discussion",

        "anticheat",
        "anticheat:ac-analysis",
        "anticheat:bypasses",

        "game:roblox-lua",

        "tutorials:beginner-guides",
        "tutorials:advanced-techniques",

        "tool:funcaptcha",

        "CS2", "Fortnite", "FiveM", "Rust", "Minecraft",
        "Coding", "Cheats", "SDK", "Game Reversal", "Offsets", "Spoofer", "Custom"
    ];

    return Array.from(new Set([...allowed, ...PUBLIC_CATEGORIES]));
}
