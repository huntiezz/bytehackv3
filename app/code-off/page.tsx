import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Swords, User, MonitorPlay, Trophy, Clock } from "lucide-react";
import { CreateMatchDialog } from "@/components/code-off/create-match-dialog";

export const revalidate = 0;

export default async function CodeOffLobby() {
    const user = await getCurrentUser();
    const supabase = await createClient();

    const { data: activeMatches } = await supabase
        .from("code_matches")
        .select(`
      *,
      player1:profiles!code_matches_player1_id_fkey(username, avatar_url),
      player2:profiles!code_matches_player2_id_fkey(username, avatar_url)
    `)
        .in("status", ["live", "voting"])
        .order("created_at", { ascending: false });

    const { data: pendingMatches } = await supabase
        .from("code_matches")
        .select(`
      *,
      player1:profiles!code_matches_player1_id_fkey(username, avatar_url)
    `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
            <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[20%] -left-[200px] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                    <div>
                        <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                            CODE OFF
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl font-light">
                            The ultimate 1v1 coding battleground. Resolve conflicts, settle bets, and prove your skills in real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <CreateMatchDialog userId={user.id} />
                        ) : (
                            <Link href="/login">
                                <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
                                    Sign in to Battle
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Live Matches */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        <h2 className="text-2xl font-bold tracking-widest uppercase">Live Battles</h2>
                    </div>

                    {activeMatches && activeMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeMatches.map((match: any) => (
                                <Card key={match.id} className="bg-[#0A0A0A] border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-300 group">
                                    <div className="p-6 relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />

                                        <div className="flex items-center justify-between mb-6">
                                            <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10 animate-pulse">
                                                LIVE NOW
                                            </Badge>
                                            <span className="text-xs font-mono text-zinc-500">
                                                {new Date(match.start_time || match.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 mb-8">
                                            {/* Player 1 */}
                                            <div className="text-center flex-1">
                                                <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-cyan-500/30 p-1 group-hover:border-cyan-500 transition-colors">
                                                    <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden">
                                                        <img src={match.player1?.avatar_url || '/pfp.png'} className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                                <div className="font-bold text-sm truncate">{match.player1?.username}</div>
                                            </div>

                                            {/* VS */}
                                            <div className="flex flex-col items-center justify-center">
                                                <Swords className="w-8 h-8 text-zinc-600 group-hover:text-white transition-colors rotate-0 group-hover:rotate-45 duration-500" />
                                                <span className="text-xs font-black text-zinc-700 font-mono mt-1">VS</span>
                                            </div>

                                            {/* Player 2 */}
                                            <div className="text-center flex-1">
                                                <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-purple-500/30 p-1 group-hover:border-purple-500 transition-colors">
                                                    <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden">
                                                        <img src={match.player2?.avatar_url || '/pfp.png'} className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                                <div className="font-bold text-sm truncate">{match.player2?.username || '???'}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Topic</div>
                                                <div className="font-medium text-lg leading-tight text-white/90">{match.topic}</div>
                                            </div>

                                            <Link href={`/code-off/${match.id}`} className="block">
                                                <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 group-hover:border-purple-500/50 text-white font-bold tracking-wider">
                                                    WATCH STREAM <MonitorPlay className="w-4 h-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                            <MonitorPlay className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-zinc-400">No active battles</h3>
                            <p className="text-zinc-600">The arena is quiet... for now.</p>
                        </div>
                    )}
                </div>

                {/* Pending Matches */}
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-2xl font-bold tracking-widest uppercase">Upcoming Challenges</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingMatches && pendingMatches.map((match: any) => (
                            <Card key={match.id} className="bg-[#0A0A0A] border-white/10 hover:border-cyan-500/50 transition-all">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                                            OPEN CHALLENGE
                                        </Badge>
                                        <span className="text-xs text-zinc-500">{new Date(match.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <h3 className="text-lg font-bold mb-2 text-white">{match.topic}</h3>
                                    <p className="text-sm text-zinc-400 mb-6 line-clamp-2">{match.description || 'No description provided.'}</p>

                                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-2">
                                            <img src={match.player1?.avatar_url || '/pfp.png'} className="w-6 h-6 rounded-full" />
                                            <span className="text-sm font-medium text-zinc-300">{match.player1?.username}</span>
                                        </div>
                                        <Link href={`/code-off/${match.id}`}>
                                            <Button size="sm" variant="secondary" className="text-xs font-bold">
                                                VIEW DETAILS
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {(!pendingMatches || pendingMatches.length === 0) && (
                            <div className="col-span-full text-center py-12 text-zinc-600">
                                No pending challenges. Start one yourself!
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
