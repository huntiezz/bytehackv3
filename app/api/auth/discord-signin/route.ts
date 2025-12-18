import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize");
    discordAuthUrl.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID!);
    discordAuthUrl.searchParams.set("redirect_uri", `${baseUrl}/api/auth/discord-callback`);
    discordAuthUrl.searchParams.set("response_type", "code");
    discordAuthUrl.searchParams.set("scope", "identify email guilds.join guilds.members.read");

    return NextResponse.redirect(discordAuthUrl.toString());
}
