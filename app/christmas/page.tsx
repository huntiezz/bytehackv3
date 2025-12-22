
import { createClient } from "@/lib/supabase/server";
import { ChristmasScene } from "@/components/christmas-scene";
import { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Merry Christmas | ByteHack",
  description: "A holiday surprise from the ByteHack team.",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChristmasPage() {
  const supabase = await createClient();
  let inviteCode: string | null = null;

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  // Check if IP has already attempted
  // Note: This requires the 'christmas_attempts' table to be created in Supabase
  const { data: existingAttempt } = await supabase
    .from('christmas_attempts')
    .select('id')
    .eq('ip_address', ip)
    .single();

  if (!existingAttempt) {
    // Record the attempt
    await supabase.from('christmas_attempts').insert({ ip_address: ip });

    // 5% chance to get an invite code
    const isLucky = Math.random() < 0.05;
    console.log("Christmas Page: User (IP: " + ip + ") is lucky?", isLucky);

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

