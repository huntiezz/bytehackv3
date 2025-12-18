import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { email, password, username, inviteCode } = await req.json();

        if (!email || !password || !username || !inviteCode) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const inputInviteCode = inviteCode?.trim().toUpperCase();

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is missing. Registration cannot proceed.");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );


        const { data: codeDataArray, error: codeError } = await supabaseAdmin
            .from("invite_codes")
            .select("*")
            .ilike("code", inputInviteCode)
            .limit(1);

        if (codeError) {
            console.error("Invite lookup error:", codeError);
            return NextResponse.json({ error: "System error verifying invite code" }, { status: 500 });
        }

        const codeData = codeDataArray?.[0];

        if (!codeData) {
            return NextResponse.json({ error: "Invalid invite code (Not found)" }, { status: 400 });
        }

        if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
            return NextResponse.json({ error: "Invite code expired" }, { status: 400 });
        }

        if (codeData.max_uses !== null && codeData.uses >= codeData.max_uses) {
            return NextResponse.json({ error: "Invite code max uses reached" }, { status: 400 });
        }

        const { data: existingUser } = await supabaseAdmin
            .from("profiles")
            .select("username")
            .eq("username", username.toLowerCase().replace(/\s+/g, '_'))
            .single();

        if (existingUser) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username: username.toLowerCase().replace(/\s+/g, '_'),
            }
        });

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        if (!userData.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        // --- ATOMIC PROFILE CREATION ---

        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to allow triggers/auth content to settle

        const pfps = ["/pfp.png", "/pfp2.png", "/pfp3.png", "/pfp4.png"];
        const banners = ["/banner.gif", "/banner2.gif", "/banner3.jpg"];
        const randomPfp = pfps[Math.floor(Math.random() * pfps.length)];
        const randomBanner = banners[Math.floor(Math.random() * banners.length)];

        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: userData.user.id,
                username: username.toLowerCase().replace(/\s+/g, '_'),
                name: username,
                email: email,
                display_name: username,
                role: 'member',
                is_admin: false,
                avatar_url: randomPfp,
                banner_url: randomBanner,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (profileError) {
            console.error("CRITICAL: Profile creation failed for user", userData.user.id, profileError);

            // Attempt Rollback
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
            if (deleteError) console.error("CRITICAL: Failed to rollback (delete) auth user:", deleteError);

            return NextResponse.json({
                error: `Profile creation failed: ${profileError.message || JSON.stringify(profileError)}`
            }, { status: 500 });
        }

        // --- SUCCESS PATH ---

        // Simple update to decrement uses. Redemption tracking can be done via triggers or logs if strictly needed,
        // but for now we prioritize successful registration.
        await supabaseAdmin
            .from("invite_codes")
            .update({ uses: codeData.uses + 1 })
            .eq("id", codeData.id);

        // Optional: track redemption
        try {
            await supabaseAdmin
                .from("invite_code_redemptions")
                .insert({
                    invite_code_id: codeData.id,
                    user_id: userData.user.id
                });
        } catch (e) {
            console.error("Redemption log failed (non-critical):", e);
        }

        return NextResponse.json({ success: true, message: "Account created successfully" });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
