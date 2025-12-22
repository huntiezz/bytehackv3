import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ChristmasScene } from "@/components/christmas-scene";
import { Metadata } from "next";
import { headers, cookies } from "next/headers";

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

  const cookieStore = await cookies();
  const deviceId = cookieStore.get("bh_device_id")?.value;

  // Check if IP or Device has already attempted
  let query = supabase
    .from('christmas_attempts')
    .select('ip_address, invite_code');

  if (deviceId) {
    query = query.or(`ip_address.eq.${ip},device_id.eq.${deviceId}`);
  } else {
    query = query.eq('ip_address', ip);
  }

  const { data: existingAttempt } = await query.maybeSingle();

  let alreadyRevealed = false;

  // Logic: 
  // 1. If debug (forceWin), always proceed regardless of attempts.
  // 2. If not debug, strictly check existing attempt.
  // Logic: 
  // 1. If debug (forceWin), always proceed regardless of attempts.
  // 2. If not debug, strictly check existing attempt.
  if (existingAttempt && !forceWin) {
    console.log("Christmas Page: IP " + ip + " / Device " + deviceId + " already attempted. Code:", existingAttempt.invite_code);
    inviteCode = existingAttempt.invite_code;
    alreadyRevealed = true;
  }
  // If not existing, we let the client handle the attempt generation via API to support fingerprinting.

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <ChristmasScene inviteCode={inviteCode} initialRevealed={alreadyRevealed} />
    </div>
  );
}
