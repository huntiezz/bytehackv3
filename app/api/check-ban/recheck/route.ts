import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const headersList = await headers();
    const cookieStore = await cookies();
    
    const forwarded = headersList.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "unknown";
    
    const userId = cookieStore.get("user_id")?.value;

    const supabase = await createClient();

    if (userId) {
      const { data: banData } = await supabase.rpc('is_user_banned', {
        check_user_id: userId
      });

      if (banData && banData.length > 0 && banData[0].is_banned) {
        return NextResponse.json({
          isBanned: true,
          type: 'banned',
          reason: banData[0].ban_reason,
          bannedBy: banData[0].banned_by_name || 'System',
          expiresAt: banData[0].expires_at,
          isPermanent: banData[0].is_permanent
        });
      }
    }

    const { data: ipData } = await supabase.rpc('is_ip_blacklisted', {
      check_ip: ipAddress
    });

    if (ipData && ipData.length > 0 && ipData[0].is_blacklisted) {
      return NextResponse.json({
        isBanned: true,
        type: 'blacklisted',
        reason: ipData[0].reason,
        bannedBy: ipData[0].banned_by_name || 'System',
        expiresAt: ipData[0].expires_at,
        isPermanent: ipData[0].is_permanent
      });
    }

    return NextResponse.json({ isBanned: false });
  } catch (error) {
    console.error("Error rechecking ban status:", error);
    return NextResponse.json(
      { error: "Failed to recheck ban status" },
      { status: 500 }
    );
  }
}
