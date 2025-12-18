import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { checkUserBan } from "./check-ban";

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const discordSession = cookieStore.get('discord_admin_session');

  if (discordSession && discordSession.value && discordSession.value.trim() !== '') {
    try {
      const sessionData = JSON.parse(discordSession.value);

      if (sessionData.expires_at && sessionData.expires_at > Date.now() && sessionData.is_admin) {
        return {
          id: sessionData.discord_id,
          name: sessionData.discord_username,
          discord_username: sessionData.discord_username,
          discord_avatar: sessionData.discord_avatar,
          role: 'admin',
          email: null,
        };
      }
    } catch (error) {
      console.error('Error parsing Discord session:', error);
      const cookieStore = await cookies();
      cookieStore.delete('discord_admin_session');
    }
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    console.log("getCurrentUser: No auth user found from Supabase");
    return null;
  }

  const { data: user } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return user;
});

export const getCurrentUserWithBanCheck = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, banInfo: null };
  }

  const banCheck = await checkUserBan(user.id);

  return {
    user: banCheck.isBanned ? null : user,
    banInfo: banCheck.isBanned ? banCheck : null
  };
});
