import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        const { profileId } = await req.json();
        if (!profileId) {
            return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
        }

        const supabase = await createClient();
        const user = await getCurrentUser();

        const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
        const encoder = new TextEncoder();
        const data = encoder.encode(ip + "salt");
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        let inserted = false;

        if (user) {
            const { error } = await supabase
                .from("profile_views")
                .insert({
                    profile_id: profileId,
                    viewer_id: user.id
                });
            if (!error) inserted = true;
        } else {
            const { error } = await supabase
                .from("profile_views")
                .insert({
                    profile_id: profileId,
                    ip_hash: ipHash
                });
            if (!error) inserted = true;
        }

        if (inserted) {
            await supabase.rpc('increment_profile_view', { profile_id: profileId });
            return NextResponse.json({ success: true, counted: true });
        }

        return NextResponse.json({ success: true, counted: false });

    } catch (error) {
        console.error("View tracking error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
