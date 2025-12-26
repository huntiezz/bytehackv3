import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/account-settings?error=github_denied`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`);
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    // GitHub uses the same redirect URI as sent in the authorize request
    // Note: GitHub sometimes is strict about exact matching.
    // We don't send redirect_uri in the access_token request for GitHub usually needed, but good to check docs if issues arise.
    // Actually standard GitHub flow just needs code, client_id, client_secret.

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${appUrl}/account-settings?error=github_config_missing`);
    }

    try {
        // 1. Exchange code for token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("GitHub Token Error:", tokenData);
            return NextResponse.redirect(`${appUrl}/account-settings?error=github_token_failed`);
        }

        // 2. Fetch User Info
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `token ${tokenData.access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            console.error("GitHub User Error:", userData);
            return NextResponse.redirect(`${appUrl}/account-settings?error=github_user_failed`);
        }

        // 3. Update Profile
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                github_id: userData.id.toString(),
                github_username: userData.login,
                github_avatar_url: userData.avatar_url,
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Profile Update Error:", updateError);
            return NextResponse.redirect(`${appUrl}/account-settings?error=profile_update_failed`);
        }

        return NextResponse.redirect(`${appUrl}/account-settings?success=github_linked`);

    } catch (err) {
        console.error("GitHub Link Unexpected Error:", err);
        return NextResponse.redirect(`${appUrl}/account-settings?error=unknown`);
    }
}
