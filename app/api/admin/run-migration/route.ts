import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.login_tokens (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                token TEXT UNIQUE NOT NULL,
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;

        const { error: checkError } = await supabaseAdmin
            .from('login_tokens')
            .select('id')
            .limit(1);

        if (checkError && checkError.message.includes('does not exist')) {
            return NextResponse.json({
                success: false,
                message: 'Please run this SQL in your Supabase SQL Editor:',
                sql: createTableSQL + `
                    CREATE INDEX IF NOT EXISTS idx_login_tokens_token ON public.login_tokens(token);
                    CREATE INDEX IF NOT EXISTS idx_login_tokens_expires_at ON public.login_tokens(expires_at);
                    GRANT SELECT, INSERT, DELETE ON public.login_tokens TO service_role;
                `
            });
        }

        return NextResponse.json({
            success: true,
            message: 'login_tokens table already exists or migration completed'
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
