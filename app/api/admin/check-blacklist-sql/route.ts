import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "unknown";

    const supabase = await createClient();

    const { data: allEntries, error } = await supabase
      .from("ip_blacklist")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: myEntries } = await supabase
      .from("ip_blacklist")
      .select("*")
      .eq("ip_address", ipAddress);

    const { data: rpcCheck } = await supabase.rpc('is_ip_blacklisted', {
      check_ip: ipAddress
    });

    const { data: rpcCheckLocalhost } = await supabase.rpc('is_ip_blacklisted', {
      check_ip: "::1"
    });

    return NextResponse.json({
      yourIp: ipAddress,
      allBlacklistEntries: allEntries || [],
      entriesForYourIp: myEntries || [],
      rpcCheckResult: rpcCheck || [],
      rpcCheckLocalhost: rpcCheckLocalhost || [],
      error: error?.message
    });
  } catch (error) {
    console.error("Error checking blacklist:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
