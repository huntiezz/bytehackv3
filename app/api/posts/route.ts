import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to post" }, { status: 401 });
    }

    const { title, content, category } = await req.json();

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json({ error: "Title cannot exceed 100 characters." }, { status: 400 });
    }

    if (content.length > 20000) {
      return NextResponse.json({ error: "Post content cannot exceed 20000 characters." }, { status: 400 });
    }

    const { checkCategoryPermission } = await import("@/lib/forum-permissions");
    const hasPermission = await checkCategoryPermission(user.id, category);

    if (!hasPermission) {
      return NextResponse.json({ error: "You do not have permission to post in this category." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("threads")
      .insert({
        title,
        body: content,
        category,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
