import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { checkUserBan } from "./check-ban";

import { createHmac } from "crypto";

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (authUser) {
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    // Check if user is banned
    if (user && user.is_banned) {
      return null;
    }

    return user;
  }



  console.log("getCurrentUser: No auth user found");
  return null;
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
