
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const { success } = await rateLimit(`register:${ip}`, 5, 3600);

        if (!success) {
            return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
        }

        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\"/g, "").trim();
        const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\"/g, "").trim();

        const envHealth = {
            urlStart: supabaseUrl.substring(0, 15),
            keyLength: serviceKey.length,
            isServiceRole: serviceKey.includes("service_role") || serviceKey.length > 100
        };

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({ error: "Service configuration error", envHealth }, { status: 503 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        const { data: ipBan, error: ipCheckError } = await supabaseAdmin
            .from('ip_blacklist')
            .select('reason')
            .eq('ip_address', ip)
            .maybeSingle();

        if (ipCheckError) {
            console.error("[Register] IP Check Error (Service Key might be invalid):", ipCheckError.message);
        }

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
            // DEEP DIAGNOSTICS
            const diag: any = {};

            // 1. Check if we can see ANY codes
            const { data: allCodes } = await supabaseAdmin.from("invite_codes").select("code").limit(5);
            diag.reachable_codes = allCodes?.map(c => c.code) || [];

            // 2. Check if we can see profiles (to verify connection health)
            const { count: profileCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
            diag.profileCount = profileCount;

            // 3. Verify exactly what the key is (decode JWT payload)
            try {
                const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString());
                diag.keyRole = payload.role;
                diag.keyProj = payload.ref;
            } catch (e) {
                diag.keyRole = "Invalid/Malformed Key";
            }

            console.error(`[Register] Validation failed. Diag:`, diag);

            return NextResponse.json({
                error: `Invalid invite code: ${inputInviteCode}`,
                debug: codeError ? codeError.message : "Not found in DB",
                diag,
                envHealth
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

        // Verify that the email was actually verified (security check)
        const { data: emailVerifyCheck, error: emailVerifyError } = await supabaseAdmin
            .from("email_verifications")
            .select("verified_at")
            .eq("email", email)
            .not("verified_at", "is", null)
            .gt("verified_at", new Date(Date.now() - 3600000).toISOString()) // Verified in last 1 hour
            .limit(1)
            .maybeSingle();

        if (emailVerifyError) {
            console.error("Email verification check error:", emailVerifyError);
        }

        if (!emailVerifyCheck) {
            return NextResponse.json({ error: "Email verification required. Please verify your email." }, { status: 400 });
        }

        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username: username.toLowerCase().replace(/\s+/g, '_'),
                email_verified: true
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
                email_verified: true,
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
