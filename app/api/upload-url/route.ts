import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    const ext = filename.substring(filename.lastIndexOf('.'));
    const uniqueId = crypto.randomUUID().replace(/-/g, '');
    const safeFilename = `${uniqueId}${ext}`;

    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from('products')
      .createSignedUploadUrl(safeFilename);

    if (error) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const publicUrl = `https://${projectRef}.storage.supabase.co/storage/v1/object/public/products/${safeFilename}`;

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      filename: safeFilename,
      publicUrl,
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
