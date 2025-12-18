import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, price, quantity, deliverables, deliverable_note, deliverable_file_url, image_url, status } = await req.json();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        title,
        description,
        price,
        quantity,
        deliverables,
        deliverable_note,
        deliverable_file_url,
        image_url,
        status,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
