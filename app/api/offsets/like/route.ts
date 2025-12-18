import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to like offsets" }, { status: 401 });
    }

    const { offsetId } = await req.json();

    if (!offsetId) {
      return NextResponse.json({ error: "Missing offsetId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: offset } = await supabase
      .from("offsets")
      .select("game_name")
      .eq("id", offsetId)
      .single();

    if (!offset) {
      return NextResponse.json({ error: "Offset not found" }, { status: 404 });
    }

    const { data: allVersions } = await supabase
      .from("offsets")
      .select("id")
      .eq("game_name", offset.game_name);

    const versionIds = allVersions?.map(v => v.id) || [];

    const { data: existingLike } = await supabase
      .from("offset_likes")
      .select("id, offset_id")
      .in("offset_id", versionIds)
      .eq("user_id", user.id)
      .single();

    let liked = false;

    if (existingLike) {
      await supabase
        .from("offset_likes")
        .delete()
        .eq("id", existingLike.id);
      
      liked = false;
    } else {
      await supabase
        .from("offset_likes")
        .insert({
          offset_id: offsetId,
          user_id: user.id,
        });
      
      liked = true;
    }

    const { count } = await supabase
      .from("offset_likes")
      .select("*", { count: "exact", head: true })
      .in("offset_id", versionIds);

    return NextResponse.json({ 
      liked,
      likes: count || 0
    });
  } catch (error) {
    console.error("Error toggling offset like:", error);
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}
