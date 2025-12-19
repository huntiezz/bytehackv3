import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
    const results: any = {};

    try {
        // 1. Check Env Vars
        results.env = {
            url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        };

        // 2. Check Current User (Session)
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        results.user = user ? { id: user.id, email: user.email } : "No User";

        if (user) {
            // 3. Check Ban with Service Role
            const adminClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: banData, error: banError } = await adminClient
                .from('bans')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .maybeSingle();

            results.banCheck = {
                found: !!banData,
                data: banData,
                error: banError ? banError.message : null
            };

            // 4. Check Profile is_banned flag
            const { data: profile } = await adminClient
                .from('profiles')
                .select('is_banned')
                .eq('id', user.id)
                .single();

            results.profileCheck = profile;
        }

        return NextResponse.json(results);
    } catch (e: any) {
        return NextResponse.json({ error: e.message, results }, { status: 500 });
    }
}
