import { createClient } from "@/lib/supabase/server";

export type NotificationType =
    | 'file_approved'
    | 'comment'
    | 'reply'
    | 'like_post'
    | 'like_comment'
    | 'profile_comment'
    | 'profile_like'
    | 'system_message';

interface CreateNotificationParams {
    userId: string;
    actorId?: string;
    type: NotificationType;
    title?: string;
    message: string;
    referenceId?: string;
    referenceUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: params.userId,
            actor_id: params.actorId || null,
            type: params.type,
            title: params.title || null,
            message: params.message,
            reference_id: params.referenceId || null,
            reference_url: params.referenceUrl || null,
            read: false
        });

        if (error) {
            console.error("Failed to create notification:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error("Exception creating notification:", err);
        return { success: false, error: err };
    }
}
