
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const { success } = await rateLimit(`register:${ip}`, 3, 3600);

        if (!success) {
            return NextResponse.json({ error: "Too many registration attempts. Please try again in an hour." }, { status: 429 });
        }

        // Check for IP Blacklist
        // We need a supabase client with service role to check global blacklist
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\"/g, '');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\"/g, '');

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({ error: "Service configuration error" }, { status: 503 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        const { data: ipBan } = await supabaseAdmin
            .from('ip_blacklist')
            .select('reason')
            .eq('ip_address', ip)
            .maybeSingle();

        if (ipBan) {
            return NextResponse.json({ error: "This IP address is blacklisted." }, { status: 403 });
        }

        const { email, password, username, inviteCode } = await req.json();

        if (!email || !password || !username || !inviteCode) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const inputInviteCode = inviteCode?.trim().toUpperCase();
        console.log(`[Register Debug] Searching for code: '${inputInviteCode}'`);

        const { data: codeDataArray, error: codeError } = await supabaseAdmin
            .from("invite_codes")
            .select("*")
            .ilike("code", inputInviteCode)
            .limit(1);

        if (codeError) {
            console.error("[Register Debug] Error fetching code:", JSON.stringify(codeError));
        }

        if (codeError || !codeDataArray?.[0]) {
            console.error(`[Register] Validation failed for code: '${inputInviteCode}'. Data:`, codeDataArray);
            return NextResponse.json({
                error: `Invalid invite code: ${inputInviteCode}`,
                debug: codeError ? codeError.message : "Not found in DB"
            }, { status: 400 });
        }

        const codeData = codeDataArray[0];

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
            if (createError.message.includes("registered")) {
                return NextResponse.json({ error: "Registration failed" }, { status: 400 });
            }
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        if (!userData.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
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
                email: email,
                display_name: username,
                role: 'member',
                is_admin: false,
                avatar_url: randomPfp,
                banner_url: randomBanner,
                last_ip: ip,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
            return NextResponse.json({ error: "Profile creation failed" }, { status: 500 });
        }

        await supabaseAdmin
            .from("invite_codes")
            .update({ uses: codeData.uses + 1 })
            .eq("id", codeData.id);

        try {
            await supabaseAdmin
                .from("invite_code_redemptions")
                .insert({
                    invite_code_id: codeData.id,
                    user_id: userData.user.id
                });
        } catch (e) {
        }

        return NextResponse.json({ success: true, message: "Account created successfully" });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
