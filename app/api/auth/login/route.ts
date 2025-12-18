import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const cookieStore = await cookies();

        // Prepare response object
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
                            // Sync with Next.js CookieStore
                            cookieStore.set(name, value, options);
                            // Also explictly set on response for safety
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
            console.error("Login API: Supabase auth error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (data.user) {
            console.log("Login API: Login successful for", email, "User ID:", data.user.id);

            // --- USERNAME FIX & PROFILE CHECK ---
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile || !profile.username) {
                console.warn("Login API: User has faulty profile (NULL username). Attempting auto-fix.");

                // Construct a username from email or metadata
                const metaName = data.user.user_metadata?.username || data.user.user_metadata?.name;
                const emailName = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
                const fallbackUsername = (metaName || emailName || 'user_' + data.user.id.slice(0, 8)).toLowerCase();

                const { error: fixError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        username: fallbackUsername,
                        display_name: fallbackUsername,
                        email: email,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (fixError) {
                    console.error("Login API: Failed to auto-fix profile:", fixError);
                } else {
                    console.log("Login API: Profile auto-fixed with username:", fallbackUsername);
                }
            } else {
                console.log("Login API: Profile valid. Username:", profile.username);
            }
            // ------------------------------------
        }

        return response;
    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
