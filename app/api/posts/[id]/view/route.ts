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

    const { data: post } = await supabase
      .from('threads')
      .select('author_id')
      .eq('id', id)
      .single();

    if (post && user?.id === post.author_id) {
      return NextResponse.json({ success: true, message: 'Own thread - not tracked' });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const { error } = await supabase
      .from('thread_views')
      .insert({
        thread_id: id,
        user_id: user?.id || null,
        ip_address: ip
      });

    if (!error) {
      await supabase.rpc('increment_thread_view', { thread_id: id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
