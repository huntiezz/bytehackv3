"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function placeBet(matchId: string, prediction: "player1" | "player2", amount: number) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    if (amount <= 0) return { error: "Invalid amount" };

    const supabase = await createClient();

    // Fetch user's current coins to verify balance
    const { data: profile } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.coins || 0) < amount) {
        return { error: "Insufficient funds" };
    }

    // Start a transaction-like update
    // 1. Deduct coins
    // 2. Insert bet
    // Ideally this would be a Postgres function to be atomic, but for now we do optimistic check + sequential ops.
    // To permit "optimistic locking", we can filter update by the checked coin amount, but simple deduction is acceptable for MVP.

    const { error: deductError } = await supabase.rpc('deduct_coins', {
        user_uuid: user.id,
        amount: amount
    });

    // If we don't have the RPC, fallback to direct update (less safe for race conditions but working)
    if (deductError) {
        // Fallback: manual update
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ coins: (profile.coins || 0) - amount })
            .eq("id", user.id)
            .eq("coins", profile.coins); // Optimistic lock

        if (updateError) return { error: "Transaction failed, please retry." };
    }

    const { error: insertError } = await supabase
        .from("code_bets")
        .insert({
            match_id: matchId,
            user_id: user.id,
            amount,
            prediction,
            status: 'pending'
        });

    if (insertError) {
        // Critical: Refund if insert fails
        await supabase.rpc('add_coins', { user_uuid: user.id, amount: amount });
        return { error: "Failed to place bet" };
    }

    revalidatePath(`/code-off/${matchId}`);
    return { success: true };
}

export async function resolveMatch(matchId: string, winnerId: string | null) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin' && user.id !== (await getMatchModerator(matchId))) {
        return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    // 1. Update Match Status
    const { error: matchError } = await supabase
        .from("code_matches")
        .update({
            status: 'finished',
            winner_id: winnerId,
            end_time: new Date().toISOString()
        })
        .eq("id", matchId);

    if (matchError) return { error: "Failed to update match" };

    if (!winnerId) return { success: true }; // Draw or cancelled, no payouts? Or refund? Assuming no payouts for now.

    // 2. Calculate Payouts
    const { data: bets } = await supabase
        .from("code_bets")
        .select("*")
        .eq("match_id", matchId)
        .eq("status", "pending");

    if (!bets || bets.length === 0) return { success: true };

    // Determine winner side
    // We need to know if winnerId is player1 or player2
    const { data: match } = await supabase.from("code_matches").select("player1_id, player2_id").eq("id", matchId).single();
    if (!match) return { error: "Match not found" };

    const winnerSide = match.player1_id === winnerId ? 'player1' : (match.player2_id === winnerId ? 'player2' : null);

    if (!winnerSide) return { success: true }; // Should not happen

    const totalPot = bets.reduce((sum, b) => sum + b.amount, 0);
    const winningBets = bets.filter(b => b.prediction === winnerSide);
    const winningPool = winningBets.reduce((sum, b) => sum + b.amount, 0);

    if (winningPool === 0) {
        // House keeps it all? Or refund?
        // Let's just mark bets as lost/refunded.
        await supabase.from("code_bets").update({ status: 'lost' }).eq("match_id", matchId);
        return { success: true };
    }

    // 3. Update Bets and Distribute Winnings
    for (const bet of bets) {
        if (bet.prediction === winnerSide) {
            const share = bet.amount / winningPool;
            const payout = Math.floor(share * totalPot);

            // Update Bet status
            await supabase.from("code_bets").update({ status: 'won' }).eq("id", bet.id);

            // Pay User
            // We unfortunately have to do this in a loop or a bulk RPC. 
            // For MVP, loop is fine (slow but works).
            const { error: payError } = await supabase.rpc('add_coins', {
                user_uuid: bet.user_id,
                amount: payout
            });

            if (payError) {
                // Fallback manual
                const { data: p } = await supabase.from("profiles").select("coins").eq("id", bet.user_id).single();
                if (p) {
                    await supabase.from("profiles").update({ coins: (p.coins || 0) + payout }).eq("id", bet.user_id);
                }
            }
        } else {
            await supabase.from("code_bets").update({ status: 'lost' }).eq("id", bet.id);
        }
    }

    revalidatePath(`/code-off/${matchId}`);
    return { success: true };
}

async function getMatchModerator(matchId: string) {
    const supabase = await createClient();
    const { data } = await supabase.from("code_matches").select("moderator_id").eq("id", matchId).single();
    return data?.moderator_id;
}
