import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (currentUser.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        const body = await request.json();
        const { targetType, userId, title, message } = body;

        const supabase = await createClient();

        if (targetType === 'specific') {
            const { error } = await supabase.from('notifications').insert({
                user_id: userId,
                type: 'system_message',
                title,
                message,
                actor_id: currentUser.id
            });
            if (error) throw error;
        } else if (targetType === 'all') {
            const { data: users, error: usersError } = await supabase.from('profiles').select('id');

            if (usersError) throw usersError;

            if (users && users.length > 0) {
                const notifications = users.map(u => ({
                    user_id: u.id,
                    type: 'system_message',
                    title,
                    message,
                    actor_id: currentUser.id
                }));

                const { error } = await supabase.from('notifications').insert(notifications);
                if (error) throw error;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Send notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
