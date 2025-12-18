import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.is_admin && currentUser?.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId, isAdmin } = await request.json();

        if (!userId || isAdmin === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from("profiles")
            .update({ is_admin: isAdmin })
            .eq("id", userId);

        if (error) {
            console.error("Error updating admin status:", error);
            return NextResponse.json({ error: "Failed to update admin status" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in update-admin:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
