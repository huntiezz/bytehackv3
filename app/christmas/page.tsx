import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ChristmasScene } from "@/components/christmas-scene";
import { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Merry Christmas | ByteHack",
  description: "A holiday surprise from the ByteHack team.",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChristmasPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const forceWin = searchParams.force_win === 'true';

  // Use Service Role Key to traverse RLS and strictly enforce 1-per-IP
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  let inviteCode: string | null = null;

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  // Check if IP has already attempted
  const { data: existingAttempt } = await supabase
    .from('christmas_attempts')
    .select('id')
    .eq('ip_address', ip)
    .single();

  // Logic: 
  // 1. If debug (forceWin), always proceed regardless of attempts.
  // 2. If not debug, strictly require NO existing attempt.
  if (!existingAttempt || forceWin) {
    // Try to record attempt. If race condition (already inserted by another req), this might fail or ignore.
    const { error } = await supabase.from('christmas_attempts').insert({ ip_address: ip });

    const isLucky = Math.random() < 0.05 || forceWin;
    console.log("Christmas Page: User (IP: " + ip + ") is lucky?", isLucky, "ForceWin:", forceWin);

    if (isLucky) {
      // Fetch an unused invite code
      const { data } = await supabase
        .from('invite_codes')
        .select('code')
        .eq('used', false)
        .limit(1);

      if (data && data.length > 0) {
        inviteCode = data[0].code;
      }
    }
  } else {
    console.log("Christmas Page: IP " + ip + " already attempted.");
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <ChristmasScene inviteCode={inviteCode} />
    </div>
  );
}

