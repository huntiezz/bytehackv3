"use server";

import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";

export async function uploadFile(formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { error: "Unauthorized" };
        }

        const file = formData.get("file") as File;
        if (!file) {
            return { error: "No file provided" };
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const ext = file.name.split('.').pop()?.toLowerCase();
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const safeFilename = `${uniqueId}.${ext}`;


        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("products")
            .upload(safeFilename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: `Upload failed: ${uploadError.message}` };
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const projectRef = supabaseUrl.split('//')[1].split('.')[0];
        const publicUrl = `https://${projectRef}.storage.supabase.co/storage/v1/object/public/products/${safeFilename}`;

        const description = formData.get("description") as string || "";

        const { error: dbError } = await supabaseAdmin
            .from("file_uploads")
            .insert({
                user_id: user.id,
                filename: file.name,
                file_size: file.size,
                file_type: file.type,
                file_url: publicUrl,
                description: description,
                sha256: sha256,
                status: 'pending'
            });

        if (dbError) {
            console.error("Database error:", dbError);
            return { error: `Database insert failed: ${dbError.message}` };
        }

        return {
            success: true,
            url: publicUrl
        };

    } catch (error) {
        console.error("Server action error:", error);
        return { error: "Internal server error" };
    }
}
