import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Pin, Eye, Flame, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NewPostButton } from "@/components/new-post-button";
import { getCurrentUser } from "@/lib/auth";
import { ForumFilters } from "@/components/forum-filters";
import { UserLink } from "@/components/user-link";
import { MatrixRain } from "@/components/matrix-rain";


import { formatDistanceToNow } from "date-fns";

export const revalidate = 15;

import { redirect } from "next/navigation";

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; sort?: string; section?: string }>;
}) {
  const user = await getCurrentUser();
  const { getUserAllowedCategories } = await import("@/lib/forum-permissions");

  if (!user) {
    console.log("ForumPage: No user found. Redirecting to login.");
    redirect('/login');
  } else {
    console.log("ForumPage: User found:", user.id);
  }

  const allowedCats = await getUserAllowedCategories(user.id);
  const supabase = await createClient();

  const [
    { data: posts },
    { data: recentPosts },
    { count: threadCount },
    { count: messageCount },
    { count: memberCount },
    { data: latestMembers }
  ] = await Promise.all([
    searchParams.then(params => {
      const search = params.search || '';
      const category = params.category || '';
      const sort = params.sort || 'recent';

      let query = supabase
        .from("threads")
        .select(`
          *,
          author:profiles!threads_author_id_fkey(display_name, username, role, level, font_style, name_color, effect_label, avatar_url),
          thread_replies(count),
          thread_likes(count)
        `);

      query = query.in('category', allowedCats);

      if (search) {
        query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
      }

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (params.section) {
        if (params.section === 'coding') {
          query = query.in('category', ['SDK', 'Game Reversal', 'Offsets']);
        } else if (params.section === 'cheats') {
          query = query.or('category.in.(CS2,Fortnite,FiveM,Rust,Minecraft),category.eq.Spoofer');
        } else if (params.section === 'general') {
          query = query.not('category', 'in', '("CS2","Fortnite","FiveM","Rust","Minecraft","Coding","Cheats","SDK","Game Reversal","Offsets","Spoofer")');
        }
      }

      query = query.order("pinned", { ascending: false });

      switch (sort) {
        case 'likes': return query.order("created_at", { ascending: false });
        default: return query.order("created_at", { ascending: false });
      }
    }).then(async (query) => {
      const result = await query;
      return result;
    }),
    supabase.from("threads")
      .select(`
        *,
        author:profiles!threads_author_id_fkey(display_name, username, role, level, font_style, name_color, effect_label, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("threads").select("*", { count: 'exact', head: true }),
    supabase.from("thread_replies").select("*", { count: 'exact', head: true }),
    supabase.from("profiles").select("*", { count: 'exact', head: true }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1)
  ]);

  const latestMember = latestMembers?.[0];

  const sections = [
    {
      id: "general",
      title: "General Discussion",
      filter: (p: any) => {
        if (!p.category) return true;
        const cat = p.category.toLowerCase();
        return cat === 'general-discussion' || cat === 'general discussion';
      },
      posts: [] as any[]
    },
    {
      id: "coding",
      title: "Coding Discussion",
      filter: (p: any) => {
        if (!p.category) return false;
        const cat = p.category.toLowerCase();
        return cat === 'coding-discussion' ||
          cat === 'coding discussion' ||
          cat.startsWith('game:') ||
          cat.startsWith('tutorials:') ||
          cat.startsWith('tool:');
      },
      posts: [] as any[]
    },
    {
      id: "cheats",
      title: "Cheat Discussion",
      filter: (p: any) => {
        if (!p.category) return false;
        const cat = p.category.toLowerCase();
        return cat === 'cheat-discussion' ||
          cat === 'cheat discussion' ||
          cat.startsWith('anticheat');
      },
      posts: [] as any[]
    }
  ];

  if (posts) {
    posts.forEach((post: any) => {
      let matched = false;

      if (sections[1].filter(post)) {
        sections[1].posts.push(post);
        matched = true;
      }
      else if (sections[2].filter(post)) {
        sections[2].posts.push(post);
        matched = true;
      }
      if (!matched) {
        sections[0].posts.push(post);
      }
    });
  }

  const params = await searchParams;
  const isFiltered = !!(params.search || (params.category && params.category !== 'All'));

  return (
    <div className="min-h-screen bg-black font-sans text-foreground selection:bg-white/20">

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">

        {/* Hero / Announcement Section */}
        <div className="relative rounded-[32px] overflow-hidden bg-[#050505] border border-white/5 p-6 md:p-10 mb-8 min-h-[320px] flex items-center">
          {/* Background Effects */}
          <MatrixRain />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />

          <div className="relative z-20 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500/50" />
              DECEMBER UPDATE
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tighter leading-[1] mb-4">
              <span className="block mb-0.5">ByteForum Recode –</span>
              <span className="block mb-0.5">faster response,</span>
              <span className="block mb-0.5">realtime presence,</span>
              <span className="text-white/20 block">zero compromises.</span>
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-md font-medium">
              Welcome to the new ByteForum front-end. We're rebuilding every surface with performance in mind while keeping the monochrome neon aesthetic the community loves.
            </p>

            <div className="flex items-center gap-3">
              <Button className="h-9 px-5 rounded-full bg-white text-black hover:bg-zinc-200 font-bold tracking-wide uppercase text-[10px]">
                Explore Threads <ArrowUpRight className="w-3 h-3 ml-2" />
              </Button>
              <Button variant="outline" className="h-9 px-5 rounded-full bg-transparent border-white/10 text-white hover:bg-white/5 font-bold tracking-wide uppercase text-[10px]">
                View Roadmap
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Feed */}
          <div className="flex-1 min-w-0 space-y-8">

            {isFiltered ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {params.category ? `${params.category} Threads` : params.search ? `Search results for "${params.search}"` : 'Search Results'}
                  </h2>
                  <ForumFilters />
                </div>

                {posts?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-[#050505] border border-white/5 rounded-[32px] text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No threads found</h3>
                    <p className="text-white/40 mb-6 max-w-sm">
                      We couldn't find any threads matching your {params.category ? 'category' : 'search'} criteria.
                    </p>
                    <Link href="/forum">
                      <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white rounded-full">
                        Clear filters
                      </Button>
                    </Link>
                  </div>
                ) : (
                  posts?.map((post: any) => (
                    <a key={post.id} href={`/forum/${post.id}`} className="block group">
                      <Card className="p-6 bg-[#050505] border-white/5 hover:border-white/10 transition-all duration-300 rounded-[32px] group-hover:bg-[#0a0a0a]">
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-6 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 text-white/40 border border-white/5 group-hover:border-white/10 transition-colors">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-white group-hover:text-white/90 transition-colors truncate pr-4">{post.title}</h3>
                                {post.pinned && (
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]" title="Pinned Thread">
                                    <Pin className="w-3 h-3 fill-current transform rotate-45" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-white/40 max-w-full">
                                <span className="text-white/60 font-medium whitespace-nowrap">by</span>
                                <span className="text-white/60 font-medium truncate max-w-[150px]">{post.author?.username || 'Unknown'}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0"></span>
                                <span className="whitespace-nowrap">{formatDistanceToNow(new Date(post.created_at))} ago</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-8 text-sm text-white/30 flex-shrink-0">
                            <div className="text-center min-w-[3rem]">
                              <div className="text-white font-bold text-base">{post.thread_replies?.[0]?.count ?? post.replies_count ?? 0}</div>
                              <div className="text-[10px] font-medium tracking-wide uppercase pt-1">Replies</div>
                            </div>
                            <div className="text-center min-w-[3rem]">
                              <div className="text-white font-bold text-base">{post.view_count ?? 0}</div>
                              <div className="text-[10px] font-medium tracking-wide uppercase pt-1">Views</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </a>
                  ))
                )}
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="bg-[#050505] border border-white/5 rounded-[40px] p-8">
                  {/* Category Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-[#111] text-white hover:bg-[#161616] border border-white/5 px-4 py-1.5 rounded-full text-sm font-bold tracking-tight">
                        {section.title}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-white/20 px-1">
                        Showing {Math.min(section.posts.length, 3)}-{Math.min(section.posts.length, 3)} of {section.posts.length} threads
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-white/30 uppercase tracking-widest pr-4">
                        <span>{section.posts.length} Threads</span>
                        <span>{section.posts.reduce((acc, p) => acc + (p.view_count ?? 0), 0)} Views</span>
                      </div>
                    </div>
                  </div>

                  {/* Posts List */}
                  <div className="space-y-3">
                    {section.posts.length === 0 ? (
                      <div className="p-12 text-center text-white/20 text-sm font-medium border border-dashed border-white/5 rounded-[24px]">
                        No threads in this section yet.
                      </div>
                    ) : (
                      section.posts.slice(0, 3).map((post: any) => (
                        <a key={post.id} href={`/forum/${post.id}`} className="block group">
                          <div className="p-4 sm:p-5 rounded-[28px] bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-all duration-200">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-5 min-w-0 flex-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#111] flex items-center justify-center flex-shrink-0 text-white/30 hover:text-white transition-colors border border-white/5">
                                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-[15px] sm:text-base font-bold text-white group-hover:text-white/90 truncate">
                                      {post.title}
                                    </h3>
                                    {post.pinned && (
                                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]" title="Pinned Thread">
                                        <Pin className="w-3 h-3 fill-current transform rotate-45" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                                    <span className="text-white/50 uppercase tracking-wide text-[10px] font-bold">by</span>
                                    <span className="text-white/70 hover:text-white transition-colors truncate max-w-[100px]">
                                      {post.author?.username || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0 px-2 sm:px-4">
                                <div className="text-center w-10 sm:w-12 hidden sm:block">
                                  <div className="text-white font-bold">{post.thread_replies?.[0]?.count ?? post.replies_count ?? 0}</div>
                                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Replies</div>
                                </div>
                                <div className="text-center w-10 sm:w-12 hidden sm:block">
                                  <div className="text-white font-bold">{post.view_count ?? 0}</div>
                                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Views</div>
                                </div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#151515] flex items-center justify-center text-xs font-bold text-white/60 border border-white/5 ml-2 overflow-hidden">
                                  {post.author?.avatar_url ? (
                                    <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full object-cover" />
                                  ) : (
                                    post.author?.username?.[0]?.toUpperCase() || 'U'
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      ))
                    )}
                  </div>

                  {/* View All Button */}
                  <div className="mt-4">
                    <Link href={`/forum/${section.id}-discussion`} className="block w-full">
                      <Button
                        variant="ghost"
                        className="w-full h-12 rounded-[24px] bg-[#0A0A0A] hover:bg-[#111] text-white/60 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/5 hover:border-white/10 transition-all uppercase tracking-wide cursor-pointer"
                      >
                        View All {section.title}
                        <span className="text-lg leading-none ml-1">↗</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[380px] flex-shrink-0 space-y-6">

            {/* New Post CTA */}
            <div className="bg-[#050505] border border-white/5 p-6 rounded-[32px] flex items-center justify-between gap-4">
              <div className="text-white font-bold text-sm">Have something to share?</div>
              <NewPostButton />
            </div>

            {/* Site Stats */}
            <div className="bg-[#050505] border border-white/5 p-8 rounded-[32px]">
              <h3 className="text-sm font-bold text-white mb-8">Site Stats</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-white/40">Threads</span>
                  <span className="text-white font-mono text-base">{threadCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-white/40">Messages</span>
                  <span className="text-white font-mono text-base">{messageCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-white/40">Members</span>
                  <span className="text-white font-mono text-base">{memberCount || 0}</span>
                </div>

                <div className="pt-8 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Latest Member</p>
                  {latestMember ? (
                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-[#111] overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-colors">
                        {latestMember.avatar_url ? (
                          <img src={latestMember.avatar_url} alt={latestMember.username || 'User'} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40 font-bold">
                            {(latestMember.username || latestMember.name || 'U')[0]?.toUpperCase()}
                          </div>
                        )}                   </div>
                      <div>
                        <p className="text-sm text-white font-bold group-hover:text-primary transition-colors truncate max-w-[180px]">{latestMember.display_name || latestMember.username}</p>
                        <p className="text-xs text-white/40 font-medium whitespace-nowrap">{formatDistanceToNow(new Date(latestMember.created_at))} ago</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/40">No members yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Latest Posts Mini Feed */}
            <div className="bg-[#050505] border border-white/5 p-6 rounded-[32px]">
              <h3 className="text-sm font-bold text-white mb-6 px-2">Latest Posts</h3>
              <div className="space-y-2">
                {recentPosts?.slice(0, 5).map((post: any) => (
                  <a key={`latest-${post.id}`} href={`/forum/${post.id}`} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[#111] transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-[#151515] flex items-center justify-center flex-shrink-0 text-white/30 text-xs border border-white/5 mt-0.5 overflow-hidden">
                      {post.author?.avatar_url ? (
                        <img src={post.author?.avatar_url} alt={post.author?.username} className="w-full h-full object-cover" />
                      ) : (
                        post.author?.username?.[0] || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white leading-snug mb-1 group-hover:text-white/80 line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
