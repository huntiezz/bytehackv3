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
    
    const { data: offset } = await supabase
      .from('offsets')
      .select('author_id')
      .eq('id', id)
      .single();
    
    if (offset && user?.id === offset.author_id) {
      return NextResponse.json({ success: true, message: 'Own offset - not tracked' });
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
      .from('offset_views')
      .insert({
        offset_id: id,
        user_id: user?.id || null,
        ip_address: userIp,
      });
    
    if (!error) {
      await supabase.rpc('increment_offset_views', { offset_id: id });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking offset view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
