"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function postProfileComment(targetProfileId: string, content: string) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { error: "You must be logged in to comment." };
        }

        if (!content.trim()) {
            return { error: "Comment cannot be empty." };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from("profile_comments")
            .insert({
                target_profile_id: targetProfileId,
                author_id: user.id,
                content: content.trim(),
            });

        if (error) {
            console.error("Error posting comment:", error);
            return { error: "Failed to post comment." };
        }

        revalidatePath(`/${targetProfileId}`);

        return { success: true };
    } catch (error) {
        console.error("Server error:", error);
        return { error: "Internal server error" };
    }
}

export async function getProfileComments(targetProfileId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profile_comments")
        .select(`
            id,
            content,
            created_at,
            author:author_id (
                id,
                username,
                name,
                profile_picture,
                discord_avatar,
                discord_id
            )
        `)
        .eq("target_profile_id", targetProfileId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    return data;
}
