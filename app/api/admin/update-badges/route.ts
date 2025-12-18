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
        const { userId, badges } = body;

        if (!userId || !Array.isArray(badges)) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from("profiles")
            .update({ badges })
            .eq("id", userId);

        if (error) {
            console.error("Error updating badges:", error);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update badges error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
