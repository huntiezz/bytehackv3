import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { email, password, username, inviteCode } = await req.json();

        if (!email || !password || !username || !inviteCode) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const inputInviteCode = inviteCode?.trim().toUpperCase();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: codeData, error: codeError } = await supabaseAdmin
            .from("invite_codes")
            .select("*")
            .eq("code", inputInviteCode)
            .single();

        if (codeError || !codeData) {
            console.log(`Invite code lookup failed for: "${inputInviteCode}". Found: ${!!codeData}, Error: ${codeError?.message}`);
            return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
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
                name: username,
                username: username.toLowerCase(),
                role: 'member'
            }
        });

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        if (!userData.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        const { error: updateError } = await supabaseAdmin
            .from("invite_codes")
            .update({ uses: codeData.uses + 1 })
            .eq("id", codeData.id);

        if (updateError) {
            console.error("Failed to increment invite code usage:", updateError);
        }

        const { error: redemptionError } = await supabaseAdmin
            .from("invite_code_redemptions")
            .insert({
                invite_code_id: codeData.id,
                user_id: userData.user.id
            });

        if (redemptionError) {
            console.error("Failed to record redemption:", redemptionError);
        }


        await new Promise(resolve => setTimeout(resolve, 500));

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
                display_name: username,
                role: 'member',
                avatar_url: randomPfp,
                banner_url: randomBanner
            }, {
                onConflict: 'id'
            });

        if (profileError) {
            console.error("Profile creation error:", profileError);
        }

        return NextResponse.json({ success: true, message: "Account created successfully" });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
