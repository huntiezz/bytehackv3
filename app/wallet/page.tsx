import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CopyCode, WalletClient } from "@/components/wallet/wallet-client";
import { Card } from "@/components/ui/card";
import { Coins, History } from "lucide-react";

export const revalidate = 0;

export default async function WalletPage() {
    const user = await getCurrentUser();
    if (!user) return redirect("/login");

    const supabase = await createClient();

    // Fetch fresh profile data for coins
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) return <div>Profile error</div>;

    // Fetch user's generated invite codes
    const { data: myCodes } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

    // Calculate claim status
    const lastClaim = profile.last_daily_claim ? new Date(profile.last_daily_claim) : null;
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    let isClaimable = true;
    let nextClaimTime = null;

    if (lastClaim) {
        const timeSince = now.getTime() - lastClaim.getTime();
        if (timeSince < oneDay) {
            isClaimable = false;
            nextClaimTime = new Date(lastClaim.getTime() + oneDay);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header & Balance */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#050505] p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
                        <p className="text-zinc-400">Manage your coins and rewards.</p>
                    </div>

                    <div className="relative z-10 bg-[#0A0A0A] border border-white/10 px-8 py-4 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Coins className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <div className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Balance</div>
                            <div className="text-3xl font-bold text-white">{profile.coins || 0}</div>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-yellow-500/5 blur-[100px] pointer-events-none" />
                </div>

                {/* Actions */}
                <WalletClient
                    user={profile}
                    isClaimable={isClaimable}
                    nextClaimTime={nextClaimTime}
                />

                {/* Invite Codes History */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <History className="w-5 h-5 text-zinc-500" />
                        <h2 className="text-xl font-bold">My Invite Codes</h2>
                    </div>

                    {myCodes && myCodes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myCodes.map((code: any) => (
                                <div key={code.code} className="bg-[#050505] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-all duration-300">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${(code.max_uses !== null && code.uses >= code.max_uses) ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} />
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                                                {(code.max_uses !== null && code.uses >= code.max_uses) ? 'Redeemed' : 'Active'}
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold font-mono tracking-widest text-white mb-1 group-hover:text-primary transition-colors">
                                            {code.code}
                                        </div>
                                        <div className="text-[10px] text-zinc-600 font-medium">
                                            Purchased {new Date(code.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <CopyCode code={code.code} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl bg-white/5">
                            <p className="text-zinc-500">You haven't purchased any invite codes yet.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
