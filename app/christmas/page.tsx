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
    .select('ip_address, invite_code')
    .eq('ip_address', ip)
    .maybeSingle();

  let alreadyRevealed = false;

  // Logic: 
  // 1. If debug (forceWin), always proceed regardless of attempts.
  // 2. If not debug, strictly check existing attempt.
  if (existingAttempt && !forceWin) {
    console.log("Christmas Page: IP " + ip + " already attempted. Code:", existingAttempt.invite_code);
    inviteCode = existingAttempt.invite_code;
    alreadyRevealed = true;
  } else {
    // New Attempt OR Force Win
    const isLucky = Math.random() < 0.05 || forceWin;
    console.log("Christmas Page: User (IP: " + ip + ") is lucky?", isLucky, "ForceWin:", forceWin);

    if (isLucky) {
      // 1. Try to fetch an unused invite code
      const { data } = await supabase
        .from('invite_codes')
        .select('code')
        .eq('used', false)
        .limit(1);

      if (data && data.length > 0) {
        inviteCode = data[0].code;
      } else {
        // 2. Create one on the fly if none exist
        const { data: adminUser } = await supabase
          .from('profiles')
          .select('id')
          .or('role.eq.admin,is_admin.eq.true')
          .limit(1)
          .maybeSingle();

        if (adminUser) {
          const newCode = 'CHRISTMAS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          const { data: createdCode } = await supabase.from('invite_codes').insert({
            code: newCode,
            created_by: adminUser.id,
            uses: 0,
            max_uses: 1,
            description: 'Christmas Event Reward'
          }).select('code').single();

          if (createdCode) inviteCode = createdCode.code;
        }
      }
    }

    // Persist the attempt
    if (!existingAttempt) {
      // New user: Insert
      const { error: insertError } = await supabase.from('christmas_attempts').insert({
        ip_address: ip,
        invite_code: inviteCode
      });
      if (insertError) console.error("Attempt insert error:", insertError);
    } else if (forceWin) {
      // Debug/Force: Update existing row to save the win
      await supabase.from('christmas_attempts')
        .update({ invite_code: inviteCode })
        .eq('ip_address', ip);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <ChristmasScene inviteCode={inviteCode} initialRevealed={alreadyRevealed} />
    </div>
  );
}
