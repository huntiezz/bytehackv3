import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeInput } from "@/lib/security";

const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 14,
    PATTERN: /^[a-zA-Z0-9._-]+$/,
  },
  DISPLAY_NAME: {
    MAX_LENGTH: 14,
    PATTERN: /^[a-zA-Z0-9._\- ]+$/,
    MAX_SPACES: 1,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
};

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
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) {
      const trimmedUsername = username.trim();

      if (trimmedUsername.includes(' ')) {
        return NextResponse.json({
          error: "Username cannot contain spaces. Use only letters, numbers, dots (.), underscores (_), or hyphens (-)."
        }, { status: 400 });
      }

      if (!VALIDATION_RULES.USERNAME.PATTERN.test(trimmedUsername)) {
        return NextResponse.json({
          error: "Username can only contain letters, numbers, dots (.), underscores (_), and hyphens (-)."
        }, { status: 400 });
      }

      if (trimmedUsername.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
        return NextResponse.json({
          error: `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters.`
        }, { status: 400 });
      }

      if (trimmedUsername.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
        return NextResponse.json({
          error: `Username cannot exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters. Current length: ${trimmedUsername.length}`
        }, { status: 400 });
      }

      if (username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH + 10) {
        return NextResponse.json({
          error: "Invalid request - username too large"
        }, { status: 400 });
      }

      const supabase = await createClient();

      if (trimmedUsername.toLowerCase() !== user.username?.toLowerCase()) {
        const reservedUsernames = ['admin', 'moderator', 'system', 'root', 'support', 'help', 'bot', 'api', 'forum', 'profile'];
        if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
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
          .eq("username", trimmedUsername.toLowerCase())
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
            return NextResponse.json({
              error: `You can only change your username 2 times per 7 days. Please try again in ${7 - daysSinceLast} days.`
            }, { status: 400 });
          } else {
            newCount = 0;
          }
        }

        updateData.last_username_change = new Date().toISOString();
        updateData.username_change_count = newCount + 1;
      }

      updateData.username = trimmedUsername.toLowerCase();
    }

    if (display_name !== undefined) {
      const trimmedDisplayName = display_name.trim();

      if (!VALIDATION_RULES.DISPLAY_NAME.PATTERN.test(trimmedDisplayName)) {
        return NextResponse.json({
          error: "Display name can only contain letters, numbers, dots (.), underscores (_), hyphens (-), and spaces."
        }, { status: 400 });
      }

      if (/\s{2,}/.test(trimmedDisplayName)) {
        return NextResponse.json({
          error: "Display name cannot contain multiple consecutive spaces."
        }, { status: 400 });
      }

      const spaceCount = (trimmedDisplayName.match(/ /g) || []).length;
      if (spaceCount > VALIDATION_RULES.DISPLAY_NAME.MAX_SPACES) {
        return NextResponse.json({
          error: `Display name can contain a maximum of ${VALIDATION_RULES.DISPLAY_NAME.MAX_SPACES} space.`
        }, { status: 400 });
      }

      if (trimmedDisplayName.length > VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH) {
        return NextResponse.json({
          error: `Display name cannot exceed ${VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH} characters. Current length: ${trimmedDisplayName.length}`
        }, { status: 400 });
      }

      if (display_name.length > VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH + 10) {
        return NextResponse.json({
          error: "Invalid request - display name too large"
        }, { status: 400 });
      }

      updateData.display_name = trimmedDisplayName;
    }

    if (bio !== undefined) {
      const trimmedBio = bio.trim();

      if (trimmedBio.length > VALIDATION_RULES.BIO.MAX_LENGTH) {
        return NextResponse.json({
          error: `Bio cannot exceed ${VALIDATION_RULES.BIO.MAX_LENGTH} characters. Current length: ${trimmedBio.length}`
        }, { status: 400 });
      }

      if (bio.length > VALIDATION_RULES.BIO.MAX_LENGTH + 1000) {
        return NextResponse.json({
          error: "Invalid request - bio too large"
        }, { status: 400 });
      }

      updateData.bio = sanitizeInput(trimmedBio);
    }

    if (profile_picture !== undefined) updateData.profile_picture = profile_picture;
    if (font_style !== undefined) updateData.font_style = font_style;
    if (name_color !== undefined) updateData.name_color = name_color;
    if (name_effect !== undefined) updateData.name_effect = name_effect;
    if (profile_decoration !== undefined) updateData.profile_decoration = profile_decoration;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
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
