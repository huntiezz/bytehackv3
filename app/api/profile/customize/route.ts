import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            profile_picture,
            banner_image,
            background_media,
            background_type,
            bio,
            display_name,
        } = await req.json();

        if (background_type && !['image', 'video', 'none'].includes(background_type)) {
            return NextResponse.json({ error: "Invalid background type" }, { status: 400 });
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

        let supabase;
        if (isUUID) {
            supabase = await createClient();
        } else {
            const { createClient: createServiceClient } = await import("@supabase/supabase-js");
            supabase = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
        }

        const updateData: any = {};

        if (profile_picture !== undefined) updateData.profile_picture = profile_picture;
        if (banner_image !== undefined) updateData.banner_image = banner_image;
        if (background_media !== undefined) updateData.background_media = background_media;
        if (background_type !== undefined) updateData.background_type = background_type;
        if (bio !== undefined) updateData.bio = bio;
        if (display_name !== undefined) updateData.display_name = display_name;

        const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq(isUUID ? "id" : "discord_id", user.id);

        if (error) {
            console.error("Profile update error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Profile customization error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
