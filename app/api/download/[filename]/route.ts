import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('products')
      .download(filename);

    if (error || !data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { data: fileMetadata } = await supabase
      .from('file_uploads')
      .select('original_filename, file_type')
      .eq('filename', filename)
      .single();

    const buffer = Buffer.from(await data.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileMetadata?.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileMetadata?.original_filename || filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
