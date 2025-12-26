"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MonitorPlay, Send, Trophy, Users, Shield, Mic, MicOff, DollarSign, Swords, PlayCircle, StopCircle, UserPlus } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

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

    const videoRef1 = useRef<HTMLVideoElement>(null);
    const videoRef2 = useRef<HTMLVideoElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    const supabase = createClient();
    const isPlayer1 = currentUser?.id === match.player1_id;
    const isPlayer2 = currentUser?.id === match.player2_id;
    const isMod = currentUser?.id === match.moderator_id || currentUser?.role === 'admin';
    const isParticipating = isPlayer1 || isPlayer2;

    // Realtime subscription
    useEffect(() => {
        const channel = supabase.channel(`match:${match.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'code_matches', filter: `id=eq.${match.id}` },
                async (payload) => {
                    const newMatchData = payload.new as any;
                    let player2Data = undefined;

                    // Always try to fetch player 2 if ID exists, to ensure we have latest data/existence
                    if (newMatchData.player2_id) {
                        const { data: p2 } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', newMatchData.player2_id).single();
                        if (p2) player2Data = p2;
                    }

                    setMatch(prev => ({
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
            .subscribe();

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
            supabase.removeChannel(channel);
        };
    }, [match.id, supabase]);

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

    const totalPot = bets.reduce((acc, bet) => acc + bet.amount, 0);
    const p1Bets = bets.filter(b => b.prediction === 'player1').reduce((acc, b) => acc + b.amount, 0);
    const p2Bets = bets.filter(b => b.prediction === 'player2').reduce((acc, b) => acc + b.amount, 0);


    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Top Bar */}
            <div className="h-16 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-lg flex items-center gap-2">
                        <Swords className="text-purple-500" />
                        {match.topic}
                    </h1>
                    <Badge variant={match.status === 'live' ? 'default' : 'secondary'} className={match.status === 'live' ? 'bg-red-600 animate-pulse' : ''}>
                        {match.status.toUpperCase()}
                    </Badge>
                </div>

                <div className="flex items-center gap-6">
                    {isParticipating && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setMicEnabled(!micEnabled)}
                                className={micEnabled ? "bg-green-500/20 text-green-400" : ""}
                            >
                                {micEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                                {micEnabled ? "Voice On" : "Voice Off"}
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={startStream}
                                disabled={isStreaming}
                                className={isStreaming ? "bg-red-500/20 text-red-400" : "bg-white text-black hover:bg-zinc-200"}
                            >
                                <MonitorPlay className="w-4 h-4 mr-2" />
                                {isStreaming ? "Sharing Screen" : "Share Screen"}
                            </Button>
                        </div>
                    )}

                    <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 px-3 py-1 font-mono">
                        POT: ${totalPot}
                    </Badge>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Arena (Left & Right Streams) */}
                <div className="flex-1 bg-black relative flex">
                    {/* Player 1 View */}
                    <div className="flex-1 border-r border-white/10 relative group">
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                            <img src={match.player1?.avatar_url || '/pfp.png'} className="w-6 h-6 rounded-full" />
                            <span className="font-bold text-sm tracking-wide">{match.player1?.username}</span>
                            {match.player1_id === match.winner_id && <Trophy className="w-4 h-4 text-yellow-500" />}
                        </div>

                        <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 font-mono text-xs text-zinc-400">
                            STATUS: {isStreaming && isPlayer1 ? "LIVE" : "OFFLINE"}
                        </div>

                        <video ref={videoRef1} autoPlay muted className="w-full h-full object-contain bg-[#050505]" />

                        {!isStreaming && (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 pointer-events-none">
                                <MonitorPlay className="w-12 h-12 text-zinc-800" />
                                <span className="text-zinc-700 font-mono text-xs">WAITING FOR SIGNAL...</span>
                            </div>
                        )}
                    </div>

                    {/* Vs Divider */}
                    <div className="w-px bg-white/10 relative flex items-center justify-center z-20">
                        <div className="absolute bg-[#050505] p-2 rounded-full border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                            <span className="font-black text-purple-500">VS</span>
                        </div>
                    </div>

                    {/* Player 2 View */}
                    <div className="flex-1 relative">
                        {match.player2 ? (
                            <>
                                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="font-bold text-sm tracking-wide">{match.player2.username}</span>
                                    <img src={match.player2.avatar_url || '/pfp.png'} className="w-6 h-6 rounded-full" />
                                    {match.player2_id === match.winner_id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                </div>

                                <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 font-mono text-xs text-zinc-400">
                                    STATUS: {isStreaming && isPlayer2 ? "LIVE" : "OFFLINE"}
                                </div>

                                <video ref={videoRef2} autoPlay muted className="w-full h-full object-contain bg-[#050505]" />

                                {!isStreaming && (
                                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 pointer-events-none">
                                        <MonitorPlay className="w-12 h-12 text-zinc-800" />
                                        <span className="text-zinc-700 font-mono text-xs">WAITING FOR SIGNAL...</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                                    <UserPlus className="w-8 h-8 text-zinc-700" />
                                </div>
                                <h3 className="text-zinc-500 font-semibold">Waiting for challenger</h3>
                                {currentUser && currentUser.id !== match.player1_id && (
                                    <Button onClick={joinMatch} variant="outline" className="border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10">
                                        JOIN BATTLE
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Chat & Bets) */}
                <div className="w-96 bg-[#0A0A0A] border-l border-white/10 flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <div className="flex-1 p-3 text-center text-sm font-bold border-b-2 border-purple-500 bg-white/5 cursor-pointer">CHAT</div>
                        <div className="flex-1 p-3 text-center text-sm font-bold text-zinc-500 hover:text-white cursor-pointer hover:bg-white/5 transition-colors">BETS</div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex gap-2 items-start text-sm animate-in slide-in-from-bottom-2">
                                        <span className={cn(
                                            "font-bold whitespace-nowrap",
                                            msg.user.username === match.player1?.username ? "text-cyan-400" :
                                                msg.user.username === match.player2?.username ? "text-purple-400" :
                                                    msg.user.role === 'admin' ? "text-red-500" : "text-zinc-400"
                                        )}>
                                            {msg.user.username}:
                                        </span>
                                        <span className="text-zinc-300 break-words">{msg.message}</span>
                                    </div>
                                ))}
                                <div ref={chatScrollRef} />
                            </div>
                        </ScrollArea>

                        <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Say something..."
                                className="bg-black/50 border-white/10 focus-visible:ring-purple-500"
                            />
                            <Button size="icon" className="bg-purple-600 hover:bg-purple-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>

                    {/* Moderator Tools Panel */}
                    {isMod && (
                        <div className="p-4 border-t border-white/10 bg-white/5">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-red-400 uppercase tracking-wider">
                                <Shield className="w-3 h-3" /> Mod Controls
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {match.status === 'pending' && <Button size="sm" onClick={() => updateStatus('live')} className="w-full bg-green-600 hover:bg-green-700">GO LIVE</Button>}
                                {match.status === 'live' && <Button size="sm" onClick={() => updateStatus('voting')} className="w-full bg-yellow-600 hover:bg-yellow-700">STOP & VOTE</Button>}
                                {(match.status === 'live' || match.status === 'voting') && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => declareWinner(match.player1_id)} className="w-full border-cyan-500/50 text-cyan-400">WIN P1</Button>
                                        <Button size="sm" variant="outline" onClick={() => declareWinner(match.player2_id)} className="w-full border-purple-500/50 text-purple-400">WIN P2</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Betting Panel (Simplified view for MVP) */}
                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase">Place Bet</h3>
                            <div className="text-xs text-green-400 font-mono">My Wallet: $999</div>
                        </div>
                        <div className="flex gap-2 mb-2">
                            <Button
                                size="sm"
                                variant={betSide === 'player1' ? 'default' : 'outline'}
                                className={cn("flex-1", betSide === 'player1' ? "bg-cyan-600" : "border-white/10")}
                                onClick={() => setBetSide('player1')}
                            >
                                P1 ({p1Bets})
                            </Button>
                            <Button
                                size="sm"
                                variant={betSide === 'player2' ? 'default' : 'outline'}
                                className={cn("flex-1", betSide === 'player2' ? "bg-purple-600" : "border-white/10")}
                                onClick={() => setBetSide('player2')}
                            >
                                P2 ({p2Bets})
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Amount"
                                className="bg-black/50 border-white/10 h-9"
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                            />
                            <Button size="sm" onClick={placeBet} disabled={!betSide || !betAmount} className="bg-green-600 hover:bg-green-700">
                                BET
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
