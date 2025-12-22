import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\"/g, "").trim();
        const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\"/g, "").trim();
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

        // Save to database
        const { error } = await supabaseAdmin
            .from("email_verifications")
            .insert({
                email,
                code,
                expires_at: expiresAt
            });

        if (error) {
            console.error("Error saving verification code:", error);
            return NextResponse.json({ error: "Failed to generate verification code" }, { status: 500 });
        }

        // Send email
        const sent = await sendVerificationEmail(email, code);

        if (!sent) {
            return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Verification code sent" });

    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
