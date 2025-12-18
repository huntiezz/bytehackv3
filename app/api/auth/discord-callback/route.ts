import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

    if (!code) {
        return NextResponse.redirect(new URL("/?error=no_code", baseUrl));
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
                redirect_uri: `${baseUrl}/api/auth/discord-callback`,
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

        let hasAdminRole = false;
        const guildId = process.env.DISCORD_GUILD_ID;
        const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;

        if (guildId && adminRoleId) {
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

                    if (userRoles.includes(adminRoleId)) {
                        hasAdminRole = true;
                    }
                }
            } catch (error) {
                console.error("Error fetching Discord roles:", error);
            }
        }

        if (hasAdminRole) {
            const { createClient: createServiceClient } = await import("@supabase/supabase-js");
            const supabaseAdmin = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            let username = discordUser.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
            if (username.length > 15) {
                username = username.substring(0, 15);
            }
            if (username.length < 3) {
                username = `user_${Math.floor(Math.random() * 10000)}`;
            }

            const reservedUsernames = ['admin', 'moderator', 'system', 'root', 'support', 'help', 'bot'];
            if (reservedUsernames.includes(username)) {
                username = `${username}_${Math.floor(Math.random() * 1000)}`;
            }
            const { data: existingUser } = await supabaseAdmin
                .from("profiles")
                .select("id, discord_id")
                .eq("username", username)
                .single();

            if (existingUser && existingUser.discord_id !== discordUser.id) {
                username = `${username.substring(0, 10)}_${Math.floor(Math.random() * 10000)}`;
            }

            await supabaseAdmin
                .from("profiles")
                .upsert({
                    discord_id: discordUser.id,
                    username: username,
                    name: discordUser.username,
                    discord_username: discordUser.username,
                    discord_avatar: discordUser.avatar,
                    email: discordUser.email,
                    role: 'admin',
                    last_login: new Date().toISOString(),
                }, {
                    onConflict: 'discord_id'
                });

            const response = NextResponse.redirect(new URL("/admin", baseUrl));

            const sessionData = {
                discord_id: discordUser.id,
                discord_username: discordUser.username,
                discord_avatar: discordUser.avatar,
                is_admin: true,
                expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000),
            };

            response.cookies.set('discord_admin_session', JSON.stringify(sessionData), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return response;
        } else {
            return NextResponse.redirect(new URL("/?error=not_admin", baseUrl));
        }
    } catch (error) {
        console.error("Discord auth error:", error);
        return NextResponse.redirect(new URL("/?error=discord_auth_failed", baseUrl));
    }
}
