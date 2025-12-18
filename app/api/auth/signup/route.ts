import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { email, password, username, inviteCode } = await request.json();

  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invite_codes')
    .select('*')
    .eq('code', inviteCode)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite code expired" }, { status: 400 });
  }

  if (invite.max_uses && invite.uses >= invite.max_uses) {
    return NextResponse.json({ error: "Invite code exhausted" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: username,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    await supabaseAdmin
      .from('invite_codes')
      .update({ uses: invite.uses + 1 })
      .eq('id', invite.id);

    await supabaseAdmin
      .from('invite_code_redemptions')
      .insert({
        invite_code_id: invite.id,
        user_id: data.user.id
      });
  }

  return NextResponse.json({ success: true, user: data.user });
}
