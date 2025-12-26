import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await req.json();

    if (!provider || !['discord', 'github'].includes(provider)) {
        return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const updates: any = {};
    if (provider === 'discord') {
        updates.discord_id = null;
        updates.discord_username = null;
        updates.discord_avatar = null;
    } else if (provider === 'github') {
        updates.github_id = null;
        updates.github_username = null;
        updates.github_avatar_url = null;
    }

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
