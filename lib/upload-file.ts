import { createClient } from "@/lib/supabase/client";

/**
 * Upload file directly to Supabase Storage from client
 * Bypasses Next.js 10MB FormData limit
 */
export async function uploadFile(file: File): Promise<{ publicUrl: string; path: string }> {
  const supabase = createClient();

  const ext = file.name.substring(file.name.lastIndexOf('.'));
  const uniqueId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const filename = `${uniqueId}${ext}`;

  const { data, error } = await supabase.storage
    .from('products')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  const publicUrl = `https://${projectRef}.storage.supabase.co/storage/v1/object/public/products/${filename}`;

  return { publicUrl, path: filename };
}
