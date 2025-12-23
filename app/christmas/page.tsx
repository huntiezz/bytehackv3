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

  const { data: settings } = await supabase
    .from('christmas_settings')
    .select('is_enabled')
    .single();

  if (settings && !settings.is_enabled) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono flex-col gap-4 select-none">
        <div className="text-6xl mb-4">🎄🚫</div>
        <h1 className="text-3xl font-bold text-red-500 uppercase tracking-widest">Event Disabled</h1>
        <p className="text-white/60">This holiday event has been disabled by the administrator.</p>
      </div>
    );
  }

  let inviteCode: string | null = null;

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  const cookieStore = await cookies();
  const deviceId = cookieStore.get("bh_device_id")?.value;

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

  if (existingAttempt) {
    console.log("Christmas Page: IP " + ip + " / Device " + deviceId + " already attempted. Code:", existingAttempt.invite_code);
    inviteCode = existingAttempt.invite_code;
    alreadyRevealed = true;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <ChristmasScene inviteCode={inviteCode} initialRevealed={alreadyRevealed} />
    </div>
  );
}
