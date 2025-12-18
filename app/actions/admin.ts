"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function updateUploadStatus(fileId: string, status: 'approved' | 'denied') {
    const supabase = await createClient();

    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const { data: file, error: fetchError } = await supabase
            .from("forum_uploads")
            .select("user_id, filename")
            .eq("id", fileId)
            .single();

        if (fetchError || !file) {
            return { success: false, error: "File not found" };
        }

        const { error } = await supabase
            .from("forum_uploads")
            .update({ status })
            .eq("id", fileId);

        if (error) {
            console.error("Error updating status:", error);
            return { success: false, error: error.message };
        }

        await createNotification({
            userId: file.user_id,
            type: 'file_approved',
            title: `File ${status === 'approved' ? 'Approved' : 'Denied'}`,
            message: `Your file "${file.filename}" was ${status}.`,
            referenceId: fileId,
            referenceUrl: status === 'approved' ? '/downloads' : '#'
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Server action error:", error);
        return { success: false, error: "Internal server error" };
    }
}

export async function togglePostPin(postId: string, isPinned: boolean) {
    const supabase = await createClient();
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") return { success: false, error: "Unauthorized" };

        const { error } = await supabase
            .from("posts")
            .update({ is_pinned: isPinned })
            .eq("id", postId);

        if (error) throw error;
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function togglePostLock(postId: string, isLocked: boolean) {
    const supabase = await createClient();
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") return { success: false, error: "Unauthorized" };

        const { error } = await supabase
            .from("posts")
            .update({ is_locked: isLocked })
            .eq("id", postId);

        if (error) throw error;
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deletePostAdmin(postId: string, reason: string) {
    const supabase = await createClient();
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") return { success: false, error: "Unauthorized" };

        const { data: post, error: fetchError } = await supabase
            .from("posts")
            .select("title, author_id")
            .eq("id", postId)
            .single();

        if (fetchError || !post) return { success: false, error: "Post not found" };

        const { error: deleteError } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId);

        if (deleteError) throw deleteError;

        await createNotification({
            userId: post.author_id,
            type: 'system_message',
            title: 'Your thread has been removed',
            message: `Your thread "${post.title}" was deleted by an admin. Reason: ${reason}`,
            referenceId: undefined,
            referenceUrl: '#'
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
