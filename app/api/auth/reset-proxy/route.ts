import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (!token || !type) {
        return NextResponse.redirect(new URL('/login?error=invalid_link', request.url));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Robust detection of the actual public domain
    let appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // If env var is missing or localhost, try to detect from headers
    if (!appUrl || appUrl.includes("localhost")) {
        const requestUrl = new URL(request.url);
        appUrl = requestUrl.origin;

        const forwardedHost = request.headers.get("x-forwarded-host");
        const hostHeader = request.headers.get("host");

        if (forwardedHost) {
            appUrl = `https://${forwardedHost}`;
        } else if (hostHeader && !hostHeader.includes("localhost")) {
            appUrl = `https://${hostHeader}`;
        }
    }

    appUrl = appUrl.replace(/\/$/, "");

    // Force the correct callback URL to ensure we land on the correct domain
    const fixedRedirect = `${appUrl}/auth/callback?next=/update-password`;

    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(fixedRedirect)}`;

    return NextResponse.redirect(verifyUrl);
}
