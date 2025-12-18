import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "unknown";

    const supabase = await createClient();

    const { data: allEntries, error: allError } = await supabase
      .from("ip_blacklist")
      .select("*")
      .eq("ip_address", ipAddress);

    const { data: rpcResult, error: rpcError } = await supabase.rpc('is_ip_blacklisted', {
      check_ip: ipAddress
    });

    return NextResponse.json({
      yourIp: ipAddress,
      allDatabaseEntries: allEntries || [],
      rpcCheckResult: rpcResult || [],
      errors: {
        allError,
        rpcError
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: "Debug failed", details: String(error) }, { status: 500 });
  }
}
