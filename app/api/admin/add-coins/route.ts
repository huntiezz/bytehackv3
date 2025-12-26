import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId, amount } = await req.json();

        if (!userId || typeof amount !== 'number') {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const supabase = await createClient();

        // Use the add_coins RPC for atomic update
        const { error } = await supabase.rpc('add_coins', {
            user_uuid: userId,
            amount: amount
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Add coins error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
