"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Gift, Ticket, Loader2, Copy, Check } from "lucide-react";
import { claimDailyReward, buyInviteCode } from "@/app/wallet/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface WalletClientProps {
    user: any;
    isClaimable: boolean;
    nextClaimTime: Date | null;
}

export function WalletClient({ user, isClaimable, nextClaimTime }: WalletClientProps) {
    const [loadingClaim, setLoadingClaim] = useState(false);
    const [loadingBuy, setLoadingBuy] = useState(false);
    const router = useRouter();

    const handleClaim = async () => {
        setLoadingClaim(true);
        try {
            const res = await claimDailyReward(user.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Claimed 50 Coins! New balance: ${res.coins}`);
                router.refresh();
            }
        } catch (e) {
            toast.error("Failed to claim");
        } finally {
            setLoadingClaim(false);
        }
    };

    const handleBuy = async () => {
        if (!confirm("Spend 1500 Coins to buy an invite code?")) return;

        setLoadingBuy(true);
        try {
            const res = await buyInviteCode(user.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Invite code purchased!");
                router.refresh();
            }
        } catch (e) {
            toast.error("Failed to buy code");
        } finally {
            setLoadingBuy(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Daily Reward Card */}
            <div className="bg-[#050505] border border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center relative overflow-hidden group hover:border-white/10 transition-colors duration-300">
                <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-300">
                    <Gift className="w-7 h-7 text-yellow-500" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Daily Reward</h3>
                <p className="text-zinc-500 text-sm mb-8 font-medium leading-relaxed max-w-[200px]">
                    Claim your free 50 coins every 24 hours. Don't miss out!
                </p>

                <div className="mt-auto w-full">
                    <Button
                        onClick={handleClaim}
                        disabled={!isClaimable || loadingClaim}
                        className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold tracking-wide text-xs uppercase"
                    >
                        {loadingClaim ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            isClaimable ? "Claim 50 Coins" :
                                `Next: ${nextClaimTime ? nextClaimTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Tomorrow'}`}
                    </Button>
                </div>
            </div>

            {/* Buy Invite Card */}
            <div className="bg-[#050505] border border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center relative overflow-hidden group hover:border-white/10 transition-colors duration-300">

                <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-300">
                    <Ticket className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Buy Invite Code</h3>
                <p className="text-zinc-500 text-sm mb-8 font-medium leading-relaxed max-w-[200px]">
                    Generate a unique invite code to give to a friend.
                </p>

                <div className="mt-auto w-full space-y-4">
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0A0A] border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <Coins className="w-3 h-3 text-yellow-500" />
                            Cost: 1500 Coins
                        </div>
                    </div>

                    <Button
                        onClick={handleBuy}
                        disabled={(user.coins || 0) < 1500 || loadingBuy}
                        className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold tracking-wide text-xs uppercase border border-white/5"
                    >
                        {loadingBuy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Purchase Code"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function CopyCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const onCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Code copied!");
    };

    return (
        <Button variant="ghost" size="icon" onClick={onCopy} className="h-8 w-8 hover:bg-white/10">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
        </Button>
    )
}
