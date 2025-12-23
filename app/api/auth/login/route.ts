
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";

export async function POST(request: Request) {
    try {
        const captchaToken = request.headers.get("x-captcha-token");

        // Server-side CAPTCHA verification
        if (process.env.NODE_ENV === "production" && process.env.RECAPTCHA_SECRET_KEY) {
            if (!captchaToken) {
                return NextResponse.json({ error: "Captcha required" }, { status: 400 });
            }

            const verifyRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`, { method: 'POST' });
            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
                return NextResponse.json({ error: "Invalid captcha" }, { status: 400 });
            }
        }

        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const { success } = await rateLimit(`login:${ip}`, 5, 300);

        if (!success) {
            return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const response = NextResponse.json({ success: true });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                            response.cookies.set(name, value, options);
                        });
                    },
                },
                cookieOptions: {
                    name: 'bytehack-auth',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                }
            }
        );

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', data.user.id)
                .single();

            // Check if user is banned
            const { data: banData } = await supabase
                .from('bans')
                .select('*')
                .eq('user_id', data.user.id)
                .eq('is_active', true)
                .maybeSingle();

            if (banData) {
                const isExpired = banData.expires_at && new Date(banData.expires_at) < new Date();
                if (!isExpired) {
                    await supabase.auth.signOut();
                    return NextResponse.json({
                        error: "Account banned",
                        banReason: banData.reason,
                        expiresAt: banData.expires_at
                    }, { status: 403 });
                }
            }

            if (!profile || !profile.username) {
                const fallbackUsername = (data.user.user_metadata?.username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    username: fallbackUsername,
                    display_name: fallbackUsername,
                    email: email,
                    last_ip: ip,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
            } else {
                // Update IP for existing user if saved profile exists
                await supabase.from('profiles').update({
                    last_ip: ip,
                    last_login: new Date().toISOString()
                }).eq('id', data.user.id);
            }
        }

        return response;
    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ error: "Request failed" }, { status: 500 });
    }
}
