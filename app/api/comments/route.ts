import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to comment" }, { status: 401 });
    }

    const { postId, content, parentCommentId } = await req.json();

    if (!postId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment cannot exceed 2000 characters." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: comment, error } = await supabase
      .from("thread_replies")
      .insert({
        thread_id: postId,
        body: content,
        author_id: user.id,
        parent_id: parentCommentId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      const { data: post } = await supabase
        .from("threads")
        .select("title, author_id")
        .eq("id", postId)
        .single();

      if (post && post.author_id !== user.id) {
        await createNotification({
          userId: post.author_id,
          actorId: user.id,
          type: 'comment',
          title: 'New Reply',
          message: `${user.username || 'Someone'} replied to your thread "${post.title}"`,
          referenceId: postId,
          referenceUrl: `/forum/${postId}`
        });
      }

      if (parentCommentId) {
        const { data: parentComment } = await supabase
          .from("thread_replies")
          .select("author_id, body")
          .eq("id", parentCommentId)
          .single();

        if (parentComment && parentComment.author_id !== user.id && parentComment.author_id !== post?.author_id) {
          await createNotification({
            userId: parentComment.author_id,
            actorId: user.id,
            type: 'reply',
            title: 'New Reply',
            message: `${user.username || 'Someone'} replied to your comment: "${parentComment.body.substring(0, 30)}..."`,
            referenceId: postId,
            referenceUrl: `/forum/${postId}`
          });
        }
      }

    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: comment } = await supabase
      .from("thread_replies")
      .select("author_id")
      .eq("id", commentId)
      .single();

    if (!comment || comment.author_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("thread_replies")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
