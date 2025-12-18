import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType } = await req.json();

        const { createClient: createServiceClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const ext = filename.split('.').pop();
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const safeFilename = `${uniqueId}.${ext}`;

        const { data, error } = await supabaseAdmin.storage
            .from('products')
            .createSignedUploadUrl(safeFilename);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const projectRef = supabaseUrl.split('//')[1].split('.')[0];
        const publicUrl = `https://${projectRef}.storage.supabase.co/storage/v1/object/public/products/${safeFilename}`;

        return NextResponse.json({
            signedUrl: data.signedUrl,
            path: safeFilename,
            publicUrl: publicUrl
        });

    } catch (error) {
        console.error("Presigned URL error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
