import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/forum";
    let origin = requestUrl.origin;
    const forwardedHost = request.headers.get("x-forwarded-host");
    const hostHeader = request.headers.get("host");

    if (forwardedHost) {
        origin = `https://${forwardedHost}`;
    } else if (hostHeader && !hostHeader.includes("localhost")) {
        origin = `https://${hostHeader}`;
    }

    origin = origin.replace(/\/$/, "");

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
