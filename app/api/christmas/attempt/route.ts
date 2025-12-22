
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fingerprint } = body;

        // Force Win Debug Check (Passed from client or header?)
        // Better to check specific header or just rely on random.
        // The user previously used a URL param ?force_win=true. 
        // We can pass this in the body too.
        const forceWin = body.forceWin === true;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { persistSession: false, autoRefreshToken: false }
            }
        );

        // Global Killswitch Check
        const { data: settings } = await supabase
            .from('christmas_settings')
            .select('is_enabled')
            .single();

        if (settings && !settings.is_enabled && !forceWin) {
            return NextResponse.json({ error: "Event Disabled" }, { status: 403 });
        }

        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";

        const cookieStore = await cookies();
        let deviceId = cookieStore.get("bh_device_id")?.value;

        // If no device ID cookie, generating one here won't set it in the browser automatically 
        // unless we return it in Set-Cookie header.
        // Middleware handles generation usually.

        let query = supabase
            .from('christmas_attempts')
            .select('invite_code')
            .or(`ip_address.eq.${ip},device_id.eq.${deviceId || 'none'},fingerprint.eq.${fingerprint || 'none'}`)
            .maybeSingle();

        const { data: existingAttempt } = await query;

        if (existingAttempt && !forceWin) {
            return NextResponse.json({
                success: true,
                alreadyAttempted: true,
                inviteCode: existingAttempt.invite_code
            });
        }

        // New Attempt
        const isLucky = Math.random() < 0.05 || forceWin;
        let inviteCode: string | null = null;

        if (isLucky) {
            // Fetch/Create Code Logic
            const { data } = await supabase
                .from('invite_codes')
                .select('code')
                .eq('used', false)
                .limit(1);

            if (data && data.length > 0) {
                inviteCode = data[0].code;
            } else {
                // Auto-create
                const { data: adminUser } = await supabase
                    .from('profiles')
                    .select('id')
                    .or('role.eq.admin,is_admin.eq.true')
                    .limit(1)
                    .maybeSingle();

                if (adminUser) {
                    const newCode = 'CHRISTMAS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                    const { data: createdCode } = await supabase.from('invite_codes').insert({
                        code: newCode,
                        created_by: adminUser.id,
                        uses: 0,
                        max_uses: 1,
                        description: 'Christmas Event Reward'
                    }).select('code').single();
                    if (createdCode) inviteCode = createdCode.code;
                }
            }
        }

        // Verify we aren't creating duplicate if race condition, but we checked above.
        // Insert new attempt
        if (!existingAttempt) {
            await supabase.from('christmas_attempts').insert({
                ip_address: ip,
                device_id: deviceId || null,
                fingerprint: fingerprint || null,
                invite_code: inviteCode
            });
        } else if (forceWin) {
            await supabase.from('christmas_attempts')
                .update({ invite_code: inviteCode })
                .eq('ip_address', ip);
        }

        return NextResponse.json({
            success: true,
            inviteCode: inviteCode,
            isLucky
        });

    } catch (error) {
        console.error("Christmas Attempt Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
