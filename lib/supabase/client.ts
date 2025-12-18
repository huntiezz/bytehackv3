import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const clientUrl = process.env.NODE_ENV === 'production'
    ? `${typeof window !== 'undefined' ? window.location.origin : baseUrl}/api/supabase`
    : supabaseUrl;

  return createBrowserClient(
    clientUrl,
    supabaseKey
  )
}
