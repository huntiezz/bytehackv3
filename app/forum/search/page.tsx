import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Folder, FileText, ShoppingBag, ArrowRight, MessageSquare, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q } = await searchParams;

    if (!q) {
        return (
            <div className="container mx-auto py-12 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-white/40" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-white">Search Forum</h1>
                <p className="text-white/40">Type something in the search bar to get started.</p>
            </div>
        );
    }

    const supabase = await createClient();
    const query = `%${q}%`;

    // Search threads (title or body)
    // We search across ALL categories as requested.
    const { data: posts } = await supabase
        .from("threads")
        .select(`
            *,
            author:profiles!threads_author_id_fkey(username, display_name, avatar_url)
        `)
        .or(`title.ilike.${query},body.ilike.${query}`)
        .order("created_at", { ascending: false })
        .limit(20);

    const hasResults = posts && posts.length > 0;

    return (
        <div className="min-h-screen bg-black pt-8 pb-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex items-end gap-4 mb-8 border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-bold text-white">
                        Search results for <span className="text-[#FFD700]">"{q}"</span>
                    </h1>
                    <span className="text-white/40 mb-1.5 font-mono text-sm">
                        {posts?.length || 0} matches found
                    </span>
                </div>

                {!hasResults && (
                    <div className="text-white/40 p-12 border border-white/5 bg-[#0a0a0a] rounded-[24px] text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white/20" />
                            </div>
                            <p>No results found matching your query.</p>
                        </div>
                    </div>
                )}

                {hasResults && (
                    <div className="space-y-4">
                        {posts?.map((post: any) => (
                            <Link key={post.id} href={`/forum/${post.id}`} className="block group">
                                <div className="p-6 rounded-[20px] bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all duration-200 group-hover:bg-[#0f0f0f]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 text-xs font-bold tracking-wider text-white/30 uppercase">
                                                <span className="text-[#FFD700]">{post.category}</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                                            </div>

                                            <h3 className="text-lg font-bold text-white group-hover:text-[#FFD700] transition-colors mb-2 truncate">
                                                {post.title}
                                            </h3>

                                            <p className="text-sm text-white/50 line-clamp-2 font-medium">
                                                {post.body?.replace(/[#*`_]/g, '') || 'No preview available'}
                                            </p>
                                        </div>

                                        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/5">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-white mb-0.5">
                                                    {post.author?.display_name || post.author?.username || 'Unknown'}
                                                </div>
                                                <div className="text-[10px] text-white/30 uppercase tracking-wider">Author</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-[#151515] border border-white/10 overflow-hidden">
                                                {post.author?.avatar_url ? (
                                                    <img src={post.author?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/40">
                                                        {(post.author?.username?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
