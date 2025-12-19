import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin || (admin.role !== 'admin' && !admin.is_admin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ipAddress } = await req.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: "Missing ipAddress" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("ip_blacklist")
      .delete()
      .eq("ip_address", ipAddress);

    if (error) {
      console.error("Error removing IP blacklist:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "IP blacklist removed successfully"
    });
  } catch (error) {
    console.error("Error in unban-ip API:", error);
    return NextResponse.json(
      { error: "Failed to remove IP blacklist" },
      { status: 500 }
    );
  }
}
