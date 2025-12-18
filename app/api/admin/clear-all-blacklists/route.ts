import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("ip_blacklist")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error("Error clearing blacklists:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "All IP blacklists cleared"
    });
  } catch (error) {
    console.error("Error in clear-all-blacklists API:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
