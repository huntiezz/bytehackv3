import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabaseAdmin
            .from("invite_codes")
            .select("*");

        return NextResponse.json({
            config: {
                url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            },
            data,
            error
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
