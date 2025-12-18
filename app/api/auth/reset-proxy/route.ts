import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    const redirect_to = searchParams.get("redirect_to");

    if (!token || !type || !redirect_to) {
        return NextResponse.redirect(new URL('/login?error=invalid_link', request.url));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    return NextResponse.redirect(verifyUrl);
}
