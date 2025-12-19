import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      display_name,
      username,
      bio,
      profile_picture,
      font_style,
      name_color,
      name_effect,
      profile_decoration
    } = await req.json();

    const updateData: any = {
      display_name,
      username: username?.toLowerCase(),
      bio,
      profile_picture,
      updated_at: new Date().toISOString(),
    };

    if (font_style !== undefined) updateData.font_style = font_style;
    if (name_color !== undefined) updateData.name_color = name_color;
    if (name_effect !== undefined) updateData.name_effect = name_effect;
    if (profile_decoration !== undefined) updateData.profile_decoration = profile_decoration;

    const supabase = await createClient();
    if (username && username.toLowerCase() !== user.username?.toLowerCase()) {
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json({ error: "Username can only contain letters, numbers, underscores, and hyphens." }, { status: 400 });
      }

      if (username.length < 3 || username.length > 15) {
        return NextResponse.json({ error: "Username must be between 3 and 15 characters." }, { status: 400 });
      }

      const reservedUsernames = ['admin', 'moderator', 'system', 'root', 'support', 'help', 'bot'];
      if (reservedUsernames.includes(username.toLowerCase())) {
        return NextResponse.json({ error: "This username is reserved." }, { status: 400 });
      }

      const { createClient: createServiceClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: existingUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .neq("id", user.id)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("last_username_change, username_change_count")
        .eq("id", user.id)
        .single();

      const lastChange = profile?.last_username_change ? new Date(profile.last_username_change) : null;
      const count = profile?.username_change_count || 0;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let newCount = count;
      if (lastChange && lastChange < sevenDaysAgo) {
        newCount = 0;
      }

      if (newCount >= 2) {

        if (lastChange && lastChange > sevenDaysAgo) {
          const daysSinceLast = Math.ceil((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
          return NextResponse.json({ error: `You can only change your username 2 times per 7 days. Please try again in ${7 - daysSinceLast} days.` }, { status: 400 });
        } else {
          newCount = 0;
        }
      }

      updateData.last_username_change = new Date().toISOString();
      updateData.username_change_count = newCount + 1;
    }

    if (display_name && display_name.length > 20) {
      return NextResponse.json({ error: "Display name cannot exceed 20 characters." }, { status: 400 });
    }

    if (bio && bio.length > 500) {
      return NextResponse.json({ error: "Bio cannot exceed 500 characters." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      // Postgres error code 23505 is unique_violation
      if (error.code === '23505') {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
