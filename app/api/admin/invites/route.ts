import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.is_admin && user.role !== 'admin')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerClient();

        const { data: codes, error } = await supabase
            .from("invite_codes")
            .select(`
                *,
                creator:profiles!created_by(username, display_name)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching invite codes:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (codes && codes.length > 0) {
            const codesWithRedemptions = await Promise.all(
                codes.map(async (code) => {
                    const { data: redemptions } = await supabase
                        .from("invite_code_redemptions")
                        .select("created_at, user_id")
                        .eq("invite_code_id", code.id);

                    return {
                        ...code,
                        redemptions: redemptions || []
                    };
                })
            );
            return NextResponse.json(codesWithRedemptions || []);
        }

        return NextResponse.json(codes || []);
    } catch (error) {
        console.error("Error in GET /api/admin/invites:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || (!user.is_admin && user.role !== 'admin')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { customCode, maxUses, expiresAt, notes } = body;

        const code = customCode && customCode.trim() !== ""
            ? customCode.trim().toUpperCase()
            : 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from("invite_codes")
            .insert({
                code,
                created_by: user.id,
                max_uses: maxUses ? parseInt(maxUses) : null,
                expires_at: expiresAt || null,
                description: notes || null,
                uses: 0
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating invite code:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in POST /api/admin/invites:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || (!user.is_admin && user.role !== 'admin')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code required" }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from("invite_codes")
            .delete()
            .eq("code", code);

        if (error) {
            console.error("Error deleting invite code:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/admin/invites:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || (!user.is_admin && user.role !== 'admin')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, code, description, maxUses, expiresAt } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const updates: any = {};
        if (code !== undefined) updates.code = code.toUpperCase();
        if (description !== undefined) updates.description = description;
        if (maxUses !== undefined) updates.max_uses = maxUses ? parseInt(maxUses) : null;
        if (expiresAt !== undefined) updates.expires_at = expiresAt;

        const { data, error } = await supabase
            .from("invite_codes")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating invite code:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in PATCH /api/admin/invites:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
