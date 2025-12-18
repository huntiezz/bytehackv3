import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      postId,
      fileName,
      fileSize,
      contentType,
      publicUrl,
      sha256
    } = body;

    if (!publicUrl || !fileName) {
      return NextResponse.json({ error: "Missing file information" }, { status: 400 });
    }

    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('thread_attachments')
      .insert({
        file_name: fileName,
        description: fileName,
        file_size: fileSize,
        content_type: contentType,
        sha256: sha256 || null,
        public_url: publicUrl,
        uploader_id: user.id,
        thread_id: postId || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json({
        error: `Database insert failed: ${error.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: data,
      url: publicUrl,
    });

  } catch (error) {
    console.error("Attachment registration error:", error);
    return NextResponse.json({ error: "Failed to register attachment" }, { status: 500 });
  }
}
