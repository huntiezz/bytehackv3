import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();
    
    if (user?.id === id) {
      return NextResponse.json({ success: true, message: 'Own profile - not tracked' });
    }
    
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let userIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
    
    if (userIp === 'unknown' || userIp === '::1' || userIp === '127.0.0.1' || userIp.startsWith('::ffff:127.0.0.1')) {
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIp = ipData.ip || userIp;
      } catch (error) {}
    }
    
    const { error } = await supabase
      .from('profile_views')
      .insert({
        profile_id: id,
        user_id: user?.id || null,
        ip_address: userIp,
      });
    
    if (!error) {
      await supabase.rpc('increment_profile_views', { profile_id_param: id });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking profile view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
