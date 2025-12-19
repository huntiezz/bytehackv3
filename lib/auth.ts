import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { checkUserBan } from "./check-ban";

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();


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
