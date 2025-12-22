import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\"/g, "").trim();
        const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\"/g, "").trim();
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        // Check verification code
        const { data: verification, error: fetchError } = await supabaseAdmin
            .from("email_verifications")
            .select("*")
            .eq("email", email)
            .eq("code", code)
            .is("verified_at", null)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError || !verification) {
            return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
        }

        // Mark as verified
        await supabaseAdmin
            .from("email_verifications")
            .update({ verified_at: new Date().toISOString() })
            .eq("id", verification.id);

        // If user is logged in, update their profile
        const user = await getCurrentUser();
        if (user) {
            await supabaseAdmin
                .from("profiles")
                .update({
                    email: email,
                    email_verified: true
                })
                .eq("id", user.id);
        }

        return NextResponse.json({
            success: true,
            message: "Email verified successfully",
            token: verification.id // Can be used for registration verification
        });

    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
