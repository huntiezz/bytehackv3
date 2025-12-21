import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) return NextResponse.json({ error: "No code provided" });

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log("Looking up code:", code);

        // Try exact match
        const { data: exact, error: exactError } = await supabaseAdmin
            .from("invite_codes")
            .select("*")
            .eq("code", code);

        // Try ilike
        const { data: ilike, error: ilikeError } = await supabaseAdmin
            .from("invite_codes")
            .select("*")
            .ilike("code", code);

        return NextResponse.json({
            param: code,
            exact: { data: exact, error: exactError },
            ilike: { data: ilike, error: ilikeError },
            env: { hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
