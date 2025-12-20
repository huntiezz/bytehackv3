import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Settings } from "lucide-react";
import { format } from "date-fns";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { getCurrentUser } from "@/lib/auth";
import { BADGES_CONFIG } from "@/lib/badges";
import { ActivityGraph } from "@/components/activity-graph";
import { ProfileActivityList, ProfilePostsList } from "@/components/profile-activity-list";

export const revalidate = 0;

const FONT_MAP: Record<string, string> = {
    default: "inherit",
    mono: "monospace",
    serif: "serif",
    comicsans: '"Comic Sans MS", "Chalkboard SE", sans-serif',
    impact: "Impact, sans-serif",
    courier: '"Courier New", Courier, monospace',
    verdana: "Verdana, Geneva, sans-serif",
    georgia: "Georgia, serif",
    trebuchet: '"Trebuchet MS", sans-serif',
    arial: "Arial, sans-serif",
    proggy: "var(--font-proggy)",
    helvetica: "Helvetica, Arial, sans-serif",
    times: '"Times New Roman", Times, serif',
    palatino: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    garamond: '"Garamond", serif',
    bookman: '"Bookman Old Style", serif',
    candara: "Candara, Calibri, Segoe, sans-serif",
    consolas: "Consolas, monospace",
    monaco: "Monaco, monospace",
    lucida: '"Lucida Console", Monaco, monospace',
    rockwell: '"Rockwell", serif',
    copperplate: "Copperplate, Papyrus, fantasy",
    brush: '"Brush Script MT", cursive',
};

interface ProfilePageProps {
    params: Promise<{
        username: string;
    }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const supabase = await createClient();
    const currentUser = await getCurrentUser();

    const { data: user, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username)
        .single();

    if (error || !user) {
        notFound();
    }

    const [
        { count: totalPosts },
        { count: totalOffsets },
        { count: totalComments },
        { data: recentPosts },
        { data: recentComments },
        { data: allPostsLikes },
        { data: allCommentsLikes }
    ] = await Promise.all([
        supabase.from("threads").select("*", { count: 'exact', head: true }).eq("author_id", user.id),
        supabase.from("offsets").select("*", { count: 'exact', head: true }).eq("author_id", user.id),
        supabase.from("thread_replies").select("*", { count: 'exact', head: true }).eq("author_id", user.id),
        supabase.from("threads").select("*, thread_replies(count), thread_likes(count)").eq("author_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("thread_replies").select("*, thread:threads(title, id), thread_reply_likes(count)").eq("author_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("threads").select("thread_likes(count)").eq("author_id", user.id),
        supabase.from("thread_replies").select("thread_reply_likes(count)").eq("author_id", user.id)
    ]);

    const postsLikesCount = allPostsLikes?.reduce((acc: number, curr: any) => acc + (curr.thread_likes?.[0]?.count || 0), 0) || 0;
    const commentsLikesCount = allCommentsLikes?.reduce((acc: number, curr: any) => acc + (curr.thread_reply_likes?.[0]?.count || 0), 0) || 0;
    const reactionScore = postsLikesCount + commentsLikesCount;

    const activities = [
        ...(recentPosts || []).map((p: any) => ({
            type: 'post',
            id: p.id,
            date: new Date(p.created_at),
            content: p.title,
            referenceId: p.id,
            subtext: p.body?.substring(0, 100) || "",
            stats: { replies: p.thread_replies?.[0]?.count || 0, likes: p.thread_likes?.[0]?.count || 0 },
            title: p.title,
            category: p.category || 'General'
        })),
        ...(recentComments || []).map((c: any) => ({
            type: 'comment',
            id: c.id,
            date: new Date(c.created_at),
            content: c.body,
            referenceId: c.thread_id,
            subtext: c.thread?.title ? `on ${c.thread.title}` : "",
            stats: { likes: c.thread_reply_likes?.[0]?.count || 0 },
            title: c.thread?.title || "thread",
            category: "Reply"
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    function getRoleBadge(role: string) {
        switch (role) {
            case 'owner': return <img src="/owner_icon.png" alt="Owner" className="w-5 h-5 object-contain" />;
            case 'admin': return <img src="/admin_icon.png" alt="Admin" className="w-5 h-5 object-contain" />;
            case 'moderator': return <img src="/moderator_icon.png" alt="Mod" className="w-5 h-5 object-contain" />;
            default: return null;
        }
    }

    const isOnline = user.last_seen && (new Date().getTime() - new Date(user.last_seen).getTime() < 5 * 60 * 1000);

    return (
        <div className="min-h-screen bg-black text-zinc-100 flex justify-center py-12 px-4 font-sans selection:bg-white/20">
            <ProfileViewTracker profileId={user.id} />
            <div className="w-full max-w-[920px] space-y-6">

                {/* Profile Card */}
                <div className="relative rounded-[32px] overflow-hidden bg-[#050505] border border-zinc-900/50 shadow-2xl">

                    {/* Top Right Stats - Views */}
                    <div className="absolute top-6 right-6 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
                        <Eye className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400">VIEWS {user.view_count || 0}</span>
                    </div>

                    {/* Edit Button */}
                    {currentUser?.id === user.id && (
                        <div className="absolute top-6 left-6 z-50">
                            <Link href="/account">
                                <Button size="sm" variant="ghost" className="h-8 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white backdrop-blur-md rounded-lg px-3 text-[11px] border border-white/5 transition-all uppercase tracking-wider font-bold">
                                    <Settings className="w-3 h-3 mr-2" /> Edit
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Banner Section */}
                    <div className="h-[240px] w-full relative">
                        {user.banner_url ? (
                            <Image
                                src={user.banner_url}
                                alt="Banner"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[#0a0a0a]">
                                <Image
                                    src="/banner_fallback.jpg"
                                    alt="Banner pattern"
                                    fill
                                    className="object-cover opacity-30 mix-blend-overlay grayscale"
                                />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-[#050505]/40 to-[#050505]" />
                            </div>
                        )}
                        {/* Gradient Fade to Bottom Content */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/20 to-[#050505]" />
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent" />
                    </div>

                    {/* Profile Body */}
                    <div className="px-10 pb-10 relative flex items-start -mt-[72px]">

                        {/* Avatar */}
                        <div className="relative z-20 shrink-0">
                            <div className="w-[144px] h-[144px] rounded-full p-[6px] bg-[#050505]">
                                <div className="w-full h-full rounded-full overflow-hidden relative bg-zinc-900 border border-zinc-800">
                                    {user.avatar_url ? (
                                        <Image src={user.avatar_url} alt={username} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-4xl font-bold text-zinc-700">
                                            {username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Online Dot */}
                            <div className={`absolute bottom-4 right-4 w-5 h-5 rounded-full border-[4px] border-[#050505] ${isOnline ? 'bg-emerald-500' : 'bg-zinc-700'} shadow-lg`} />
                        </div>

                        {/* User Details */}
                        <div className="flex-1 pt-[80px] pl-6">

                            {/* Name & Badges */}
                            <div className="flex items-center gap-3 mb-2">
                                <h1
                                    className={`text-[28px] font-bold text-white tracking-tight leading-none drop-shadow-sm name-glow username-effect-${user.effect_label || 'none'}`}
                                    style={{
                                        color: user.name_color && user.name_color !== '#ffffff' ? user.name_color : undefined,
                                        fontFamily: FONT_MAP[user.font_style || 'default'] || 'inherit'
                                    }}
                                >
                                    {user.display_name || username}
                                </h1>
                                <div className="flex items-center gap-1.5 translate-y-[1px]">
                                    {getRoleBadge(user.role)}
                                    {user.badges?.map((badgeKey: string) => {
                                        const config = BADGES_CONFIG[badgeKey];
                                        if (!config) return null;
                                        return (
                                            <div key={badgeKey} className="w-5 h-5 relative cursor-help opacity-80 hover:opacity-100 transition-opacity" title={config.label}>
                                                <img src={config.icon} alt={config.label} className="w-full h-full object-contain" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-6 mb-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-zinc-600 uppercase">
                                    POSTS <span className="text-zinc-300">{totalPosts || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-zinc-600 uppercase">
                                    REACTION SCORE <span className="text-zinc-300">{reactionScore}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-zinc-600 uppercase">
                                    JOINED <span className="text-zinc-300">{format(new Date(user.created_at), 'd MMM yyyy').toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Bio */}
                            <p className="text-[13px] leading-relaxed text-zinc-400 font-medium max-w-2xl border-t border-white/5 pt-4 mt-4">
                                {user.bio || "No bio available."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Activity Graph - GitHub Style */}
                <div className="mt-8">
                    <ActivityGraph userId={user.id} />
                </div>

                {/* Activity Feed Section */}
                <div className="bg-[#050505] border border-zinc-900/50 rounded-[32px] p-8 min-h-[400px] mt-8">
                    <Tabs defaultValue="activity" className="w-full">

                        {/* Custom Tabs List */}
                        <div className="flex justify-center mb-10 relative">
                            <TabsList className="bg-transparent p-0 h-auto gap-12 relative z-10">
                                <TabsTrigger
                                    value="activity"
                                    className="rounded-none border-0 border-b-2 border-transparent p-0 pb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600 data-[state=active]:text-white data-[state=active]:border-b-white bg-transparent hover:text-zinc-400 transition-all outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none data-[state=active]:shadow-none"
                                >
                                    Latest Activity
                                </TabsTrigger>
                                <TabsTrigger
                                    value="postings"
                                    className="rounded-none border-0 border-b-2 border-transparent p-0 pb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600 data-[state=active]:text-white data-[state=active]:border-b-white bg-transparent hover:text-zinc-400 transition-all outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none data-[state=active]:shadow-none"
                                >
                                    Postings
                                </TabsTrigger>
                            </TabsList>
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-zinc-900/50 -z-0" />
                        </div>

                        {/* Content Area */}

                        <TabsContent value="activity" className="focus:outline-none">
                            <ProfileActivityList activities={activities} posts={recentPosts || []} />
                        </TabsContent>

                        <TabsContent value="postings" className="focus:outline-none">
                            <ProfilePostsList posts={recentPosts || []} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
