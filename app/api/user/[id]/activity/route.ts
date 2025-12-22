import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const oneYearAgoStr = oneYearAgo.toISOString();

    const { data: posts } = await supabase
      .from("threads")
      .select("created_at")
      .eq("author_id", userId)
      .gte("created_at", oneYearAgoStr);

    const { data: comments } = await supabase
      .from("thread_replies")
      .select("created_at")
      .eq("author_id", userId)
      .gte("created_at", oneYearAgoStr);

    const activityMap = new Map<string, { posts: number; comments: number }>();

    posts?.forEach((post) => {
      const date = post.created_at.split('T')[0];
      const current = activityMap.get(date) || { posts: 0, comments: 0 };
      current.posts += 1;
      activityMap.set(date, current);
    });

    comments?.forEach((comment) => {
      const date = comment.created_at.split('T')[0];
      const current = activityMap.get(date) || { posts: 0, comments: 0 };
      current.comments += 1;
      activityMap.set(date, current);
    });

    const activity = Array.from(activityMap.entries()).map(([date, data]) => ({
      date,
      count: data.posts + data.comments,
      posts: data.posts,
      comments: data.comments,
    }));

    const total = activity.reduce((sum, day) => sum + day.count, 0);

    return NextResponse.json({
      activity,
      total,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
