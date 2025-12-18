import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_REQUESTS = 10;
const rateLimit = new Map<string, { count: number; expiresAt: number }>();

function getIp(req: Request) {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    return forwarded ? forwarded.split(',')[0] : realIp || "unknown";
}

export async function POST(req: Request) {
    const ip = getIp(req);
    const now = Date.now();
    const record = rateLimit.get(ip);
    if (record && now > record.expiresAt) {
        rateLimit.delete(ip);
    }

    if (record && record.count >= MAX_REQUESTS) {
        return NextResponse.json(
            { error: "Too many attempts. Please try again later." },
            { status: 429 }
        );
    }

    if (!record) {
        rateLimit.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW });
    } else {
        record.count++;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const body = await req.json();
        const code = body.code?.trim().toUpperCase();

        if (!code) {
            return NextResponse.json({ valid: false, error: "Code required" }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabaseAdmin
            .from("invite_codes")
            .select("max_uses, uses, expires_at")
            .eq("code", code)
            .single();

        if (error || !data) {
            return NextResponse.json({ valid: false, error: "Invalid code" }, { status: 400 });
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return NextResponse.json({ valid: false, error: "Code expired" }, { status: 400 });
        }

        if (data.max_uses !== null && data.uses >= data.max_uses) {
            return NextResponse.json({ valid: false, error: "Max uses reached" }, { status: 400 });
        }

        return NextResponse.json({ valid: true });

    } catch (error) {
        console.error("Validate error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
