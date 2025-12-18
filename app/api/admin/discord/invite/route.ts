import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userIds, guildId } = await req.json();

    if (!process.env.DISCORD_BOT_TOKEN) {
      return NextResponse.json({ error: "Discord bot not configured" }, { status: 500 });
    }

    const results = [];

    for (const userId of userIds) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("discord_id, discord_access_token")
        .eq("id", userId)
        .single();

      if (!userProfile?.discord_id || !userProfile?.discord_access_token) {
        results.push({ userId, success: false, error: "No Discord data" });
        continue;
      }

      try {
        const response = await fetch(
          `https://discord.com/api/guilds/${guildId}/members/${userProfile.discord_id}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token: userProfile.discord_access_token,
            }),
          }
        );

        if (response.ok || response.status === 204) {
          results.push({ userId, success: true });
        } else {
          const error = await response.text();
          results.push({ userId, success: false, error });
        }
      } catch (error) {
        results.push({ userId, success: false, error: "Request failed" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process invites" }, { status: 500 });
  }
}
