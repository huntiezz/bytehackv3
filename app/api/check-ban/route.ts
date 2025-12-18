import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { userId, ipAddress } = await req.json();

    const supabase = await createClient();

    let banInfo = null;
    if (userId) {
      const { data: banData } = await supabase.rpc('is_user_banned', {
        check_user_id: userId
      });

      if (banData && banData.length > 0 && banData[0].is_banned) {
        banInfo = {
          type: 'banned',
          reason: banData[0].ban_reason,
          bannedBy: banData[0].banned_by_name || 'System',
          expiresAt: banData[0].expires_at,
          isPermanent: banData[0].is_permanent
        };
      }
    }

    let blacklistInfo = null;
    if (ipAddress) {
      const { data: ipData } = await supabase.rpc('is_ip_blacklisted', {
        check_ip: ipAddress
      });

      if (ipData && ipData.length > 0 && ipData[0].is_blacklisted) {
        blacklistInfo = {
          type: 'blacklisted',
          reason: ipData[0].reason,
          bannedBy: ipData[0].banned_by_name || 'System',
          expiresAt: ipData[0].expires_at,
          isPermanent: ipData[0].is_permanent
        };
      }
    }

    if (blacklistInfo) {
      return NextResponse.json({ isBanned: true, ...blacklistInfo });
    }

    if (banInfo) {
      return NextResponse.json({ isBanned: true, ...banInfo });
    }

    return NextResponse.json({ isBanned: false });
  } catch (error) {
    console.error("Error checking ban status:", error);
    return NextResponse.json(
      { error: "Failed to check ban status" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ isBanned: false });
    }

    const supabase = await createClient();

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

    return NextResponse.json({ isBanned: false });
  } catch (error) {
    console.error("Error checking ban status:", error);
    return NextResponse.json(
      { error: "Failed to check ban status" },
      { status: 500 }
    );
  }
}
