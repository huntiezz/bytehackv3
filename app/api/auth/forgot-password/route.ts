import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { UAParser } from "ua-parser-js";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }


        const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "Unknown";
        const userAgent = req.headers.get("user-agent") || "";
        const parser = new UAParser(userAgent);
        const device = `${parser.getBrowser().name || 'Unknown Browser'} on ${parser.getOS().name || 'Unknown OS'}`;


        let location = "Unknown Location";
        let flag = "🌍";
        if (ip !== "Unknown" && ip !== "::1" && ip !== "127.0.0.1") {
            try {
                const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (geoData.city && geoData.country_name) {
                        location = `${geoData.city}, ${geoData.country_name}`;

                    }
                }
            } catch (e) {
                console.error("GeoIP fetch failed", e);
            }
        }


        function getFlagEmoji(countryCode: string) {
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        }


        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );


        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: {
                redirectTo: `${appUrl}/api/auth/callback?next=/update-password`,
            },
        });

        if (error) {
            console.error("Link generation error:", error);
            return NextResponse.json({ success: true });
        }

        const { action_link } = data.properties;


        const urlObj = new URL(action_link);
        const token = urlObj.searchParams.get('token');
        const type = urlObj.searchParams.get('type');
        const redirect_to = urlObj.searchParams.get('redirect_to');


        const maskedLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reset-proxy?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirect_to || '')}`;


        await sendPasswordResetEmail(email, maskedLink, {
            ip,
            location,
            device,
            flag: "🛡️"
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
