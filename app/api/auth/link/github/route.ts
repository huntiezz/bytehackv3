import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/link/github/callback`;

    if (!clientId) {
        return NextResponse.json({ error: "GitHub Client ID not configured" }, { status: 500 });
    }

    // Construct GitHub OAuth URL
    // Uses 'read:user' scope to get profile info
    const scope = "read:user";
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

    return NextResponse.redirect(url);
}
