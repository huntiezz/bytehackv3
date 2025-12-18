import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.is_admin && currentUser?.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from("profiles")
            .update({ role })
            .eq("id", userId);

        if (error) {
            console.error("Error updating role:", error);
            return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in update-role:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
