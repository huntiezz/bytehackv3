"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MonitorPlay, Send, Trophy, Users, Shield, Mic, MicOff, DollarSign, Swords, UserPlus, ArrowLeft, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ArenaClientProps {
    initialMatch: any;
    currentUser: any;
    initialBets: any[];
}

export function ArenaClient({ initialMatch, currentUser, initialBets }: ArenaClientProps) {
    const [match, setMatch] = useState(initialMatch);
    const [messages, setMessages] = useState<any[]>([]);
    const [bets, setBets] = useState(initialBets);
    const [newMessage, setNewMessage] = useState("");
    const [betAmount, setBetAmount] = useState("");
    const [betSide, setBetSide] = useState<"player1" | "player2" | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [micEnabled, setMicEnabled] = useState(false);

    const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
    const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

    const videoRef1 = useRef<HTMLVideoElement>(null);
    const videoRef2 = useRef<HTMLVideoElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    const supabase = createClient();
    const router = useRouter();
    const isPlayer1 = currentUser?.id === match.player1_id;
    const isPlayer2 = currentUser?.id === match.player2_id;
    const isMod = currentUser?.id === match.moderator_id || currentUser?.role === 'admin';
    const isParticipating = isPlayer1 || isPlayer2;

    // Realtime subscription
    useEffect(() => {
        const newChannel = supabase.channel(`match:${match.id}`)
            .on('presence', { event: 'sync' }, () => {
                const state = newChannel.presenceState();
                const speaking = new Set<string>();
                for (const key in state) {
                    state[key].forEach((presence: any) => {
                        if (presence.is_speaking && presence.user_id) speaking.add(presence.user_id);
                    });
                }
                setSpeakingUsers(speaking);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'code_matches', filter: `id=eq.${match.id}` },
                async (payload) => {
                    const newMatchData = payload.new as any;
                    let player2Data = undefined;

                    // Always try to fetch player 2 if ID exists, to ensure we have latest data/existence
                    if (newMatchData.player2_id) {
                        const { data: p2 } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', newMatchData.player2_id).single();
                        if (p2) player2Data = p2;
                    }

                    setMatch((prev: any) => ({
                        ...prev,
                        ...newMatchData,
                        ...(player2Data ? { player2: player2Data } : {}),
                        ...(newMatchData.player2_id === null ? { player2: null } : {})
                    }));
                })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'code_chat', filter: `match_id=eq.${match.id}` },
                async (payload) => {
                    const { data: user } = await supabase.from('profiles').select('username, avatar_url, role').eq('id', payload.new.user_id).single();
                    setMessages(prev => [...prev, { ...payload.new, user }]);
                    setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'code_bets', filter: `match_id=eq.${match.id}` },
                async (payload) => {
                    const { data: user } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).single();
                    setBets(prev => [{ ...payload.new, user }, ...prev]);
                }
            )
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && currentUser) {
                    await newChannel.track({ is_speaking: micEnabled, user_id: currentUser.id });
                }
            });

        setChannel(newChannel);

        // Load chat history
        const loadChat = async () => {
            const { data } = await supabase.from('code_chat')
                .select('*, user:profiles(username, avatar_url, role)')
                .eq('match_id', match.id)
                .order('created_at', { ascending: true })
                .limit(50);
            if (data) setMessages(data);
        };
        loadChat();

        return () => {
            supabase.removeChannel(newChannel);
        };
    }, [match.id, supabase, currentUser]);

    // Track mic state changes
    useEffect(() => {
        if (channel && currentUser) {
            channel.track({ is_speaking: micEnabled, user_id: currentUser.id });
        }
    }, [micEnabled, channel, currentUser]);

    // Handle local stream capture (Simulation of "Force Stream")
    const startStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setIsStreaming(true);
            if (isPlayer1 && videoRef1.current) videoRef1.current.srcObject = stream;
            if (isPlayer2 && videoRef2.current) videoRef2.current.srcObject = stream;

            // In a real app, we would send this stream to a media server here
            toast.success("Streaming started! (Local preview active)");
        } catch (err) {
            toast.error("Failed to capture screen.");
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        await supabase.from('code_chat').insert({
            match_id: match.id,
            user_id: currentUser.id,
            message: newMessage.trim()
        });
        setNewMessage("");
    };

    const placeBet = async () => {
        if (!currentUser) return toast.error("Login to bet");
        if (!betAmount || !betSide) return toast.error("Select side and amount");

        const amount = parseInt(betAmount);
        if (isNaN(amount) || amount <= 0) return toast.error("Invalid amount");

        const { error } = await supabase.from('code_bets').insert({
            match_id: match.id,
            user_id: currentUser.id,
            amount,
            prediction: betSide
        });

        if (error) toast.error(error.message);
        else {
            toast.success("Bet placed!");
            setBetAmount("");
            setBetSide(null);
        }
    };

    const updateStatus = async (status: string) => {
        await supabase.from('code_matches').update({ status }).eq('id', match.id);
    };

    const declareWinner = async (winnerId: string | null) => {
        await supabase.from('code_matches').update({
            status: 'finished',
            winner_id: winnerId
        }).eq('id', match.id);
    };

    const joinMatch = async () => {
        if (!currentUser) return toast.error("Login to join");
        await supabase.from('code_matches').update({ player2_id: currentUser.id }).eq('id', match.id);
        toast.success("You joined the match!");
    };

    const handleLeave = () => {
        router.push("/code-off");
    };

    const totalPot = bets.reduce((acc, bet) => acc + bet.amount, 0);
    const p1Bets = bets.filter(b => b.prediction === 'player1').reduce((acc, b) => acc + b.amount, 0);
    const p2Bets = bets.filter(b => b.prediction === 'player2').reduce((acc, b) => acc + b.amount, 0);


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-black text-white selection:bg-white/20">
            {/* Top Bar */}
            <div className="h-16 border-b border-white/5 bg-[#050505] flex items-center justify-between px-6 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleLeave} className="text-zinc-500 hover:text-white px-0 hover:bg-transparent transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Back
                    </Button>
                    <div className="h-6 w-px bg-white/10" />
                    <h1 className="font-bold text-sm md:text-base flex items-center gap-2 text-white">
                        <Swords className="w-5 h-5 text-white" />
                        {match.topic}
                    </h1>
                    <Badge variant={match.status === 'live' ? 'default' : 'secondary'} className={match.status === 'live' ? 'bg-red-600 animate-pulse border-red-500/50' : 'bg-white/5 border-white/10 text-zinc-400'}>
                        {match.status.toUpperCase()}
                    </Badge>
                </div>

                <div className="flex items-center gap-4">
                    {isParticipating && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMicEnabled(!micEnabled)}
                                className={cn("border-white/5 h-8 text-xs font-bold", micEnabled ? "bg-green-500/20 text-green-400 border-green-500/20" : "bg-white/5 text-zinc-400 hover:text-white")}
                            >
                                {micEnabled ? <Mic className="w-3 h-3 mr-2" /> : <MicOff className="w-3 h-3 mr-2" />}
                                {micEnabled ? "Voice On" : "Voice Off"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={startStream}
                                disabled={isStreaming}
                                className={cn("border-white/5 h-8 text-xs font-bold", isStreaming ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-white text-black hover:bg-zinc-200 border-transparent")}
                            >
                                <MonitorPlay className="w-3 h-3 mr-2" />
                                {isStreaming ? "Streaming" : "Share Screen"}
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 border border-white/5 bg-white/5 rounded-full px-3 py-1">
                        <span className="text-xs font-bold text-zinc-400">POT</span>
                        <span className="text-sm font-bold text-yellow-500">${totalPot}</span>
                    </div>

                    <Button variant="ghost" onClick={handleLeave} size="icon" className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-full">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Arena (Left & Right Streams) */}
                <div className="flex-1 bg-black relative flex w-full">
                    {/* Player 1 View */}
                    <div className="flex-1 border-r border-white/5 relative group bg-[#020202]">
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                            <div className={cn("w-6 h-6 rounded-full bg-[#111] overflow-hidden border border-white/10 transition-all duration-300", speakingUsers.has(match.player1_id) && "ring-2 ring-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]")}>
                                <img src={match.player1?.avatar_url || '/pfp.png'} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-sm tracking-wide text-white">{match.player1?.username}</span>
                            {match.player1_id === match.winner_id && <Trophy className="w-4 h-4 text-yellow-500" />}
                        </div>

                        <div className={`absolute bottom-4 left-4 z-10 px-2 py-0.5 rounded-[4px] font-bold text-[10px] tracking-wider uppercase border ${isStreaming && isPlayer1 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-black/40 text-zinc-500 border-white/5"}`}>
                            {isStreaming && isPlayer1 ? "LIVE FEED" : "OFFLINE"}
                        </div>

                        <div className="w-full h-full flex items-center justify-center relative">
                            <video ref={videoRef1} autoPlay muted className="max-w-full max-h-full object-contain" />

                            {!isStreaming && (
                                <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 pointer-events-none opacity-20">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                        <MonitorPlay className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-xs font-bold tracking-widest uppercase">P1 Signal Lost</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vs Divider */}
                    <div className="w-px bg-white/5 relative flex items-center justify-center z-20">
                        <div className="absolute bg-[#0A0A0A] px-2 py-1 rounded-sm border border-white/10 shadow-xl">
                            <span className="font-black text-xs text-white/20">VS</span>
                        </div>
                    </div>

                    {/* Player 2 View */}
                    <div className="flex-1 relative bg-[#020202]">
                        {match.player2 ? (
                            <>
                                <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex-row-reverse">
                                    <div className={cn("w-6 h-6 rounded-full bg-[#111] overflow-hidden border border-white/10 transition-all duration-300", speakingUsers.has(match.player2_id) && "ring-2 ring-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]")}>
                                        <img src={match.player2.avatar_url || '/pfp.png'} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-sm tracking-wide text-white">{match.player2.username}</span>
                                    {match.player2_id === match.winner_id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                </div>

                                <div className={`absolute bottom-4 right-4 z-10 px-2 py-0.5 rounded-[4px] font-bold text-[10px] tracking-wider uppercase border ${isStreaming && isPlayer2 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-black/40 text-zinc-500 border-white/5"}`}>
                                    {isStreaming && isPlayer2 ? "LIVE FEED" : "OFFLINE"}
                                </div>

                                <div className="w-full h-full flex items-center justify-center relative">
                                    <video ref={videoRef2} autoPlay muted className="max-w-full max-h-full object-contain" />
                                    {!isStreaming && (
                                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 pointer-events-none opacity-20">
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                                <MonitorPlay className="w-8 h-8 text-white" />
                                            </div>
                                            <span className="text-xs font-bold tracking-widest uppercase">P2 Signal Lost</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-6">
                                <div className="w-24 h-24 rounded-full border border-dashed border-white/10 flex items-center justify-center bg-white/5">
                                    <UserPlus className="w-8 h-8 text-zinc-500" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-white font-bold text-lg mb-1">Waiting for challenger</h3>
                                    <p className="text-zinc-500 text-sm">Anyone can join this open challenge.</p>
                                </div>
                                {currentUser && currentUser.id !== match.player1_id && (
                                    <Button onClick={joinMatch} className="bg-white text-black hover:bg-zinc-200 font-bold px-8 rounded-full">
                                        Join Battle
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Chat & Bets) */}
                <div className="w-[380px] bg-[#050505] border-l border-white/5 flex flex-col shrink-0 z-10 shadow-2xl">
                    {/* Tabs */}
                    <div className="flex border-b border-white/5 p-1 mx-2 mt-2">
                        <div className="flex-1 py-2 text-center text-xs font-bold text-white border-b-2 border-white cursor-pointer">LIVE CHAT</div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        {/* Fade effect at top */}
                        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none" />

                        <ScrollArea className="flex-1 px-4 py-2">
                            <div className="space-y-3 py-2">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="text-sm animate-in slide-in-from-bottom-1 duration-200 group">
                                        <div className="flex items-baseline gap-2">
                                            <span className={cn(
                                                "font-bold text-xs truncate max-w-[100px] cursor-pointer hover:underline",
                                                msg.user.username === match.player1?.username ? "text-cyan-400" :
                                                    msg.user.username === match.player2?.username ? "text-purple-400" :
                                                        msg.user.role === 'admin' ? "text-red-500" : "text-zinc-400"
                                            )}>
                                                {msg.user.username}
                                            </span>
                                            <span className="text-zinc-300 group-hover:text-white transition-colors leading-relaxed break-words">{msg.message}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatScrollRef} />
                            </div>
                        </ScrollArea>

                        <form onSubmit={sendMessage} className="p-3 border-t border-white/5 bg-[#050505]">
                            <div className="relative">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="bg-white/5 border-white/5 focus-visible:ring-0 focus-visible:border-white/20 pr-10 h-10 rounded-xl"
                                />
                                <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8 text-zinc-400 hover:text-white hover:bg-transparent">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Moderator Tools Panel */}
                    {isMod && (
                        <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                <Shield className="w-3 h-3" /> Moderator Controls
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {match.status === 'pending' && <Button size="sm" onClick={() => updateStatus('live')} className="w-full bg-green-600 hover:bg-green-700 text-xs font-bold">START MATCH</Button>}
                                {match.status === 'live' && <Button size="sm" onClick={() => updateStatus('voting')} className="w-full bg-yellow-600 hover:bg-yellow-700 text-xs font-bold">STOP & VOTE</Button>}
                                {(match.status === 'live' || match.status === 'voting') && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => declareWinner(match.player1_id)} className="w-full border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold">P1 WINS</Button>
                                        <Button size="sm" variant="outline" onClick={() => declareWinner(match.player2_id)} className="w-full border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-bold">P2 WINS</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Betting Panel */}
                    <div className="p-4 border-t border-white/5 bg-[#080808]">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Place Bet</h3>
                            <div className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded font-mono font-bold">
                                +$999
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <Button
                                size="sm"
                                variant={betSide === 'player1' ? 'default' : 'outline'}
                                className={cn("flex flex-col h-auto py-2 border-white/5", betSide === 'player1' ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20" : "bg-white/5 hover:bg-white/10 text-zinc-400")}
                                onClick={() => setBetSide('player1')}
                            >
                                <span className="text-[10px] uppercase font-bold text-white/50 mb-0.5">Player 1</span>
                                <span className="font-bold text-sm">x1.5</span>
                            </Button>
                            <Button
                                size="sm"
                                variant={betSide === 'player2' ? 'default' : 'outline'}
                                className={cn("flex flex-col h-auto py-2 border-white/5", betSide === 'player2' ? "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/20" : "bg-white/5 hover:bg-white/10 text-zinc-400")}
                                onClick={() => setBetSide('player2')}
                            >
                                <span className="text-[10px] uppercase font-bold text-white/50 mb-0.5">Player 2</span>
                                <span className="font-bold text-sm">x1.9</span>
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                                <Input
                                    placeholder="0"
                                    className="bg-white/5 border-white/5 h-9 pl-6 text-sm"
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                />
                            </div>
                            <Button size="sm" onClick={placeBet} disabled={!betSide || !betAmount} className="bg-white text-black hover:bg-zinc-200 font-bold px-4">
                                BET
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
