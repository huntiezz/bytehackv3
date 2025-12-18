import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
    }

    if (user.role !== "offset_updater" && user.role !== "admin") {
      return NextResponse.json({ 
        error: "Access denied. You need the 'offset_updater' role." 
      }, { status: 403 });
    }

    const { game_name, version, offset_data, structures, notes, description, image_url, sdk_dump_url, mem_dump_url, dump_images } = await req.json();

    if (!game_name || !version) {
      return NextResponse.json({ 
        error: "Missing required fields: game_name, version" 
      }, { status: 400 });
    }

    if (!offset_data) {
      return NextResponse.json({ 
        error: "Please provide offset data" 
      }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("offsets")
      .insert({
        game_name,
        version,
        offset_data,
        structures,
        notes,
        description,
        image_url,
        sdk_dump_url,
        mem_dump_url,
        dump_images: dump_images || [],
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating offset:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in offset creation:", error);
    return NextResponse.json({ 
      error: "Failed to create offset. Please check your input." 
    }, { status: 500 });
  }
}
