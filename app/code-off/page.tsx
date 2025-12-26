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
        <div className="min-h-screen bg-black font-sans text-foreground selection:bg-white/20">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">

                {/* Hero / Header */}
                <div className="relative rounded-[32px] overflow-hidden bg-[#050505] border border-white/5 p-6 md:p-10 mb-8 min-h-[320px] flex items-center">
                    {/* Optional: You could add MatrixRain here if desired, or keep it simple */}

                    <div className="relative z-20 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                            <Swords className="w-3 h-3 text-white" />
                            LIVE BATTLE ARENA
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tighter leading-[1] mb-4">
                            <span className="block mb-0.5">Code Off Battles –</span>
                            <span className="block mb-0.5">settle disputes,</span>
                            <span className="block mb-0.5">prove your skill,</span>
                            <span className="text-white/20 block">win bragging rights.</span>
                        </h1>

                        <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-md font-medium">
                            The ultimate 1v1 coding battleground. Resolve conflicts, settle bets, and prove your skills in real-time.
                        </p>

                        <div className="flex items-center gap-3">
                            {user ? (
                                <CreateMatchDialog userId={user.id} />
                            ) : (
                                <Link href="/login">
                                    <Button className="h-9 px-5 rounded-full bg-white text-black hover:bg-zinc-200 font-bold tracking-wide uppercase text-[10px]">
                                        Sign in to Battle
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-12">

                    {/* Live Matches Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Live Battles</h2>
                        </div>

                        {activeMatches && activeMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {activeMatches.map((match: any) => (
                                    <Link key={match.id} href={`/code-off/${match.id}`} className="block group">
                                        <Card className="bg-[#050505] border-white/5 hover:border-white/10 transition-all duration-300 rounded-[32px] p-6 relative overflow-hidden group-hover:bg-[#0a0a0a]">

                                            <div className="flex items-center justify-between mb-6">
                                                <Badge variant="secondary" className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm h-5">
                                                    LIVE
                                                </Badge>
                                                <span className="text-xs font-mono text-zinc-500">
                                                    {new Date(match.start_time || match.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 mb-8 px-2">
                                                {/* Player 1 */}
                                                <div className="text-center flex-1">
                                                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#111] p-1 border border-white/5 group-hover:border-white/20 transition-colors relative">
                                                        <img src={match.player1?.avatar_url || '/pfp.png'} className="w-full h-full object-cover rounded-xl" />
                                                    </div>
                                                    <div className="font-bold text-sm truncate text-white">{match.player1?.username}</div>
                                                </div>

                                                {/* VS */}
                                                <div className="flex flex-col items-center justify-center">
                                                    <Swords className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors rotate-0 group-hover:rotate-45 duration-500" />
                                                </div>

                                                {/* Player 2 */}
                                                <div className="text-center flex-1">
                                                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#111] p-1 border border-white/5 group-hover:border-white/20 transition-colors relative">
                                                        <img src={match.player2?.avatar_url || '/pfp.png'} className="w-full h-full object-cover rounded-xl" />
                                                    </div>
                                                    <div className="font-bold text-sm truncate text-white">{match.player2?.username || '???'}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="text-center">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Topic</div>
                                                    <div className="font-bold text-base text-white">{match.topic}</div>
                                                </div>

                                                <Button className="w-full h-10 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wide border border-white/5">
                                                    Watch Stream <MonitorPlay className="w-3 h-3 ml-2" />
                                                </Button>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-white/10 rounded-[32px] bg-white/5 p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-zinc-500">
                                    <MonitorPlay className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">No active battles</h3>
                                <p className="text-sm text-zinc-500">The arena is quiet... for now.</p>
                            </div>
                        )}
                    </div>

                    {/* Pending Matches Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Challenges</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingMatches && pendingMatches.map((match: any) => (
                                <Card key={match.id} className="bg-[#050505] border-white/5 hover:border-white/10 transition-all rounded-[32px] p-6 group">
                                    <div className="flex items-center justify-between mb-4">
                                        <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-[10px] font-bold uppercase tracking-wider rounded-sm h-5">
                                            OPEN
                                        </Badge>
                                        <span className="text-xs text-zinc-500 font-mono">{new Date(match.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <h3 className="text-lg font-bold mb-2 text-white group-hover:text-primary transition-colors">{match.topic}</h3>
                                    <p className="text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed">{match.description || 'No description provided.'}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <Link href={`/user/${match.player1?.username}`} className="flex items-center gap-3 group/user">
                                            <div className="w-8 h-8 rounded-full bg-[#111] overflow-hidden border border-white/5 group-hover/user:border-white/20 transition-colors">
                                                <img src={match.player1?.avatar_url || '/pfp.png'} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-300 group-hover/user:text-white group-hover/user:underline transition-all">{match.player1?.username}</span>
                                        </Link>
                                        <Link href={`/code-off/${match.id}`}>
                                            <Button size="sm" variant="ghost" className="text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 rounded-full px-4 h-8">
                                                VIEW
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}

                            {(!pendingMatches || pendingMatches.length === 0) && (
                                <div className="col-span-full py-12 text-center">
                                    <p className="text-zinc-500 text-sm">No pending challenges. Start one yourself!</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
