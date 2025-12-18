import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const userId = requestUrl.searchParams.get("user_id");
    const redirect = requestUrl.searchParams.get("redirect") || "/forum";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

    if (!userId) {
        return NextResponse.redirect(new URL("/?error=missing_user_id", baseUrl));
    }

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (userError || !user) {
            console.error("User not found:", userError);
            return NextResponse.redirect(new URL("/?error=user_not_found", baseUrl));
        }

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email!,
            options: {
                redirectTo: `${baseUrl}${redirect}`
            }
        });

        if (linkError || !linkData) {
            console.error("Error generating link:", linkError);
            return NextResponse.redirect(new URL("/?error=link_generation_failed", baseUrl));
        }

        const magicLinkUrl = new URL(linkData.properties.action_link);
        const accessToken = magicLinkUrl.searchParams.get('access_token');
        const refreshToken = magicLinkUrl.searchParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
            console.error("Failed to extract tokens from magic link");
            return NextResponse.redirect(new URL("/?error=token_extraction_failed", baseUrl));
        }

        const userAgent = request.headers.get("user-agent") || "Unknown Device";
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        let userIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

        if (userIp === 'unknown' || userIp === '::1' || userIp === '127.0.0.1' || userIp.startsWith('::ffff:127.0.0.1')) {
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                userIp = ipData.ip || userIp;
            } catch (error) {
                console.error('Failed to fetch public IP:', error);
            }
        }

        let location = "Unknown Location";
        if (userIp && userIp !== 'unknown' && userIp !== '::1' && userIp !== '127.0.0.1' && !userIp.startsWith('::ffff:')) {
            try {
                const locRes = await fetch(`http://ip-api.com/json/${userIp}`);
                if (locRes.ok) {
                    const locData = await locRes.json();
                    if (locData.status === 'success') {
                        location = `${locData.city}, ${locData.country}`;
                    }
                }
            } catch (err) {
            }
        }

        await supabaseAdmin
            .from("user_sessions")
            .insert({
                user_id: userId,
                ip_address: userIp,
                user_agent: userAgent,
                location: location
            });

        const response = NextResponse.redirect(new URL(redirect, baseUrl));

        const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
        const projectRef = supabaseUrl.hostname.split('.')[0];

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        };

        const authCookieName = `sb-${projectRef}-auth-token`;

        const sessionData = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 3600,
            token_type: 'bearer',
            user: user
        };

        response.cookies.set(authCookieName, btoa(JSON.stringify(sessionData)), cookieOptions);

        return response;
    } catch (error) {
        console.error("Set session error:", error);
        return NextResponse.redirect(new URL("/?error=session_failed", baseUrl));
    }
}
