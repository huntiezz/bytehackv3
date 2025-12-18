import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${baseUrl}/api/auth/callback`,
      scopes: 'identify email guilds.join guilds.members.read',
    },
  });

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
  }

  return NextResponse.redirect(data.url);
}
