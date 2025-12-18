import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkUserBan, checkIpBlacklist, getBanRedirectUrl } from "@/lib/check-ban";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  let userIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  if (userIp === 'unknown' || userIp === '::1' || userIp === '127.0.0.1' || userIp.startsWith('::ffff:127.0.0.1')) {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      userIp = ipData.ip || userIp;
    } catch (error) {
      console.error('Failed to fetch public IP:', error);
    }
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    let hasOffsetUpdaterRole = false;
    let hasAdminRole = false;
    const guildId = process.env.DISCORD_GUILD_ID;
    const offsetUpdaterRoleId = process.env.DISCORD_OFFSETUPDATER_ROLE_ID;
    const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;

    if (guildId && (offsetUpdaterRoleId || adminRoleId)) {
      try {
        const memberResponse = await fetch(
          `https://discord.com/api/users/@me/guilds/${guildId}/member`,
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        );

        if (memberResponse.ok) {
          const memberData = await memberResponse.json();
          const userRoles = memberData.roles || [];

          if (adminRoleId && userRoles.includes(adminRoleId)) {
            hasAdminRole = true;
          }

          if (offsetUpdaterRoleId && userRoles.includes(offsetUpdaterRoleId)) {
            hasOffsetUpdaterRole = true;
          }
        } else {
          const errorText = await memberResponse.text();
          console.error('[DEBUG] Failed to fetch member data:', errorText);
        }
      } catch (error) {
        console.error("Error fetching Discord roles:", error);
      }
    }

    let userRole = 'member';
    if (hasAdminRole) {
      userRole = 'admin';
    } else if (hasOffsetUpdaterRole) {
      userRole = 'offset_updater';
    }

    const supabase = await createClient();

    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("discord_id", discordUser.id)
      .single();

    let userId;

    if (existingUser) {
      await supabaseAdmin
        .from("profiles")
        .update({
          name: discordUser.username,
          email: discordUser.email,
          discord_username: discordUser.username,
          discord_avatar: discordUser.avatar,
          discord_access_token: tokens.access_token,
          discord_refresh_token: tokens.refresh_token,
          role: userRole,
          last_login: new Date().toISOString(),
          last_ip: userIp,
        })
        .eq("discord_id", discordUser.id);

      userId = existingUser.id;
    } else {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          discord_id: discordUser.id,
          name: discordUser.username,
          email: discordUser.email,
          discord_username: discordUser.username,
          discord_avatar: discordUser.avatar,
          discord_access_token: tokens.access_token,
          discord_refresh_token: tokens.refresh_token,
          role: userRole,
          last_login: new Date().toISOString(),
          last_ip: userIp,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating user:", insertError);
        throw insertError;
      }

      userId = newUser?.id;
    }

    if (!userId) {
      throw new Error("Failed to get user ID");
    }

    const userBanCheck = await checkUserBan(userId);
    if (userBanCheck.isBanned) {
      const banRedirectUrl = getBanRedirectUrl(userBanCheck);
      return NextResponse.redirect(new URL(banRedirectUrl, baseUrl));
    }

    const ipBlacklistCheck = await checkIpBlacklist(userIp);
    if (ipBlacklistCheck.isBanned) {
      const banRedirectUrl = getBanRedirectUrl(ipBlacklistCheck);
      return NextResponse.redirect(new URL(banRedirectUrl, baseUrl));
    }

    await supabaseAdmin
      .from("user_sessions")
      .insert({
        user_id: userId,
        ip_address: userIp,
      });

    const response = NextResponse.redirect(new URL("/forum", baseUrl));

    response.cookies.set("user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", baseUrl));
  }
}
