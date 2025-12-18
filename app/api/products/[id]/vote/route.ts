import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { value } = body;
        if (![1, -1].includes(value)) {
            return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from("product_votes")
            .upsert({
                product_id: id,
                user_id: user.id,
                value: value
            }, {
                onConflict: 'product_id,user_id'
            });

        if (error) {
            console.error("Vote error:", error);
            return NextResponse.json({ error: "Failed to register vote" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const { data, error } = await supabase
            .from("product_votes")
            .select("value")
            .eq("product_id", id);

        if (error) {
            return NextResponse.json({ likes: 0, dislikes: 0 });
        }

        const likes = data.filter((v: any) => v.value === 1).length;
        const dislikes = data.filter((v: any) => v.value === -1).length;

        return NextResponse.json({ likes, dislikes });

    } catch (error) {
        return NextResponse.json({ likes: 0, dislikes: 0 });
    }
}
