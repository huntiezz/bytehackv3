import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ArenaClient } from "@/components/code-off/arena-client";

export const revalidate = 0;

export default async function CodeOffArenaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    const supabase = await createClient();

    const { data: match } = await supabase
        .from("code_matches")
        .select(`
      *,
      player1:profiles!code_matches_player1_id_fkey(id, username, avatar_url),
      player2:profiles!code_matches_player2_id_fkey(id, username, avatar_url),
      moderator:profiles!code_matches_moderator_id_fkey(id, username, avatar_url)
    `)
        .eq("id", id)
        .single();

    if (!match) {
        return notFound();
    }

    // Fetch initial bets
    const { data: bets } = await supabase
        .from("code_bets")
        .select("*, user:profiles(username, avatar_url)")
        .eq("match_id", id)
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <ArenaClient
                initialMatch={match}
                currentUser={user}
                initialBets={bets || []}
            />
        </div>
    );
}
