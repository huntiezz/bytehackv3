import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { 
      userId, 
      reason, 
      durationHours,
      blacklistIp = true 
    } = await req.json();

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: userId, reason" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('ban_user', {
      target_user_id: userId,
      ban_reason: reason,
      banned_by_id: admin.id,
      ban_duration_hours: durationHours,
      also_blacklist_ip: blacklistIp
    });

    if (error) {
      console.error("Error banning user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      banId: data,
      message: "User banned successfully"
    });
  } catch (error) {
    console.error("Error in ban-user API:", error);
    return NextResponse.json(
      { error: "Failed to ban user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error: banError } = await supabase
      .from("bans")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (banError) {
      console.error("Error unbanning user:", banError);
      return NextResponse.json({ error: banError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User unbanned successfully"
    });
  } catch (error) {
    console.error("Error in unban API:", error);
    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 }
    );
  }
}
