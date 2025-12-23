
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fingerprint } = body;

        if (!fingerprint) {
            return NextResponse.json({ error: "Fingerprint required" }, { status: 400 });
        }

        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(',')[0] || "unknown";

        // Strict Race Condition & Spam Protection
        // 1 request per 10 seconds. This prevents parallel blasting to exploit race conditions.
        const { success: rateSuccess } = await rateLimit(`christmas_attempt_strict:${ip}`, 1, 10);
        if (!rateSuccess) {
            return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { persistSession: false, autoRefreshToken: false }
            }
        );

        const { data: settings } = await supabase
            .from('christmas_settings')
            .select('is_enabled')
            .single();

        if (settings && !settings.is_enabled) {
            return NextResponse.json({ error: "Event Disabled" }, { status: 403 });
        }

        const cookieStore = await cookies();
        let deviceId = cookieStore.get("bh_device_id")?.value;

        let query = supabase
            .from('christmas_attempts')
            .select('invite_code')
            .or(`ip_address.eq.${ip},device_id.eq.${deviceId || 'none'},fingerprint.eq.${fingerprint || 'none'}`)
            .maybeSingle();

        const { data: existingAttempt } = await query;

        if (existingAttempt) {
            return NextResponse.json({
                success: true,
                alreadyAttempted: true,
                inviteCode: existingAttempt.invite_code
            });
        }

        // Server-side 5% chance. This cannot be influenced by the client request.
        const isLucky = Math.random() < 0.05;
        let inviteCode: string | null = null;

        if (isLucky) {
            const { data } = await supabase
                .from('invite_codes')
                .select('code')
                .eq('used', false)
                .limit(1);

            if (data && data.length > 0) {
                inviteCode = data[0].code;
            } else {
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

        if (!existingAttempt) {
            await supabase.from('christmas_attempts').insert({
                ip_address: ip,
                device_id: deviceId || null,
                fingerprint: fingerprint || null,
                invite_code: inviteCode
            });
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
