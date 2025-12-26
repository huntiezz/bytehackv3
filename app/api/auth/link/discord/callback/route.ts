import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/account-settings?error=discord_denied`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`);
    }

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/link/discord/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${appUrl}/account-settings?error=discord_config_missing`);
    }

    try {
        // 1. Exchange code for token
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Discord Token Error:", tokenData);
            return NextResponse.redirect(`${appUrl}/account-settings?error=discord_token_failed`);
        }

        // 2. Fetch User Info
        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            console.error("Discord User Error:", userData);
            return NextResponse.redirect(`${appUrl}/account-settings?error=discord_user_failed`);
        }

        // 3. Update Profile
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                discord_id: userData.id,
                discord_username: userData.username,
                discord_avatar: userData.avatar,
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Profile Update Error:", updateError);
            return NextResponse.redirect(`${appUrl}/account-settings?error=profile_update_failed`);
        }

        return NextResponse.redirect(`${appUrl}/account-settings?success=discord_linked`);

    } catch (err) {
        console.error("Discord Link Unexpected Error:", err);
        return NextResponse.redirect(`${appUrl}/account-settings?error=unknown`);
    }
}
