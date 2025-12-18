import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameName = searchParams.get("game");

    if (!gameName) {
      return NextResponse.json({ error: "Missing game parameter" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: offset } = await supabase
      .from("offsets")
      .select("*")
      .eq("game_name", gameName)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!offset) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(offset);
  } catch (error) {
    console.error("Error fetching latest offset:", error);
    return NextResponse.json({ error: "Failed to fetch offset" }, { status: 500 });
  }
}
