import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
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

        // If user is logged in, update their profile and auth email
        const supabase = await createServerClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
            console.log(`[VerifyEmail] Updating user ${authUser.id} with email ${email}`);

            // Update Auth Email (Critical for future logins)
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                email: email,
                email_confirm: true,
                user_metadata: { email_verified: true }
            });

            if (authUpdateError) {
                console.error("[VerifyEmail] Auth update error:", authUpdateError);
            }

            // Update Profile
            const { error: profileUpdateError } = await supabaseAdmin
                .from("profiles")
                .update({
                    email: email,
                    email_verified: true,
                    updated_at: new Date().toISOString()
                })
                .eq("id", authUser.id);

            if (profileUpdateError) {
                console.error("[VerifyEmail] Profile update error:", profileUpdateError);
            }
        } else {
            console.warn("[VerifyEmail] No logged in user found during verification request");
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
