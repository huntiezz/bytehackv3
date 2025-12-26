import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ThumbsUp, Share2, FileIcon, Lock, ArrowLeft, Pin, Plus, CheckCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { CommentSection } from "@/components/comment-section";
import { ShareButton } from "@/components/share-button";
import { ViewTracker } from "@/components/view-tracker";
import { PostActions } from "@/components/post-actions";
import { StyledUsername } from "@/components/styled-username";
import { NewPostButton } from "@/components/new-post-button";
import { PostReactions } from "@/components/post-reactions";
import { checkCategoryPermission } from "@/lib/forum-permissions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Metadata } from "next";

export const revalidate = 10;

const CATEGORY_SLUGS: Record<string, any> = {
  'general-discussion': {
    title: 'General Discussion',
    description: 'Talk about anything related to game hacking.',
    icon: 'MessageSquare',
    filter: (query: any) => query.in('category', ['general-discussion', 'General Discussion', 'cheat-discussion'])
  },
  'tutorials': {
    title: 'Tutorials',
    description: 'Learn how to create cheats and use tools.',
    icon: 'BookOpen',
    filter: (query: any) => query.in('category', ['tutorials:beginner-guides', 'tutorials:advanced-techniques', 'tool:funcaptcha'])
  },
  'guides': {
    title: 'Guides',
    description: 'In-depth guides and walkthroughs.',
    icon: 'Map',
    filter: (query: any) => query.in('category', ['tutorials:beginner-guides', 'game:roblox-lua'])
  },
  'anti-cheat': {
    title: 'Anti-Cheat',
    description: 'Discuss anti-cheat bypasses and security.',
    icon: 'Shield',
    filter: (query: any) => query.in('category', ['anticheat', 'anticheat:ac-analysis', 'anticheat:bypasses'])
  },
  'offsets': {
    title: 'Offsets',
    description: 'Latest game offsets and dumps.',
    icon: 'Code2',
    filter: (query: any) => query.ilike('title', '%offset%').in('category', ['cheat-discussion', 'coding-discussion'])
  },
  'info': {
    title: 'Information',
    description: 'Community announcements and information.',
    icon: 'Info',
    filter: (query: any) => query.eq('category', 'general-discussion').ilike('title', '%announcement%')
  },
  'cs2': {
    title: 'CS2',
    description: 'Counter-Strike 2 cheats and discussions.',
    icon: 'Crosshair',
    filter: (query: any) => query.or('category.eq.cheat-discussion,category.eq.coding-discussion').ilike('title', '%cs2%')
  },
  'fortnite': {
    title: 'Fortnite',
    description: 'Fortnite cheats and discussions.',
    icon: 'Crosshair',
    filter: (query: any) => query.or('category.eq.cheat-discussion,category.eq.coding-discussion').ilike('title', '%fortnite%')
  },
  'rust': {
    title: 'Rust',
    description: 'Rust cheats and discussions.',
    icon: 'Hammer',
    filter: (query: any) => query.or('category.eq.cheat-discussion,category.eq.coding-discussion').ilike('title', '%rust%')
  },
  'coding': {
    title: 'Coding',
    description: 'Programming help and source code.',
    icon: 'Code',
    filter: (query: any) => query.eq('category', 'coding-discussion')
  },
  'games': {
    title: 'Game Forums',
    description: 'Game-specific hacking discussions.',
    icon: 'Gamepad',
    filter: (query: any) => query.ilike('category', 'game:%')
  },
  'tools': {
    title: 'Tool Forums',
    description: 'Discussions about various hacking tools.',
    icon: 'Wrench',
    filter: (query: any) => query.ilike('category', 'tool:%')
  },
  'marketplace': {
    title: 'Marketplace',
    description: 'Buy and sell services (Verify first).',
    icon: 'ShoppingBag',
    filter: (query: any) => query.eq('category', 'marketplace')
  },
  'coding-discussion': {
    title: 'Coding Discussion',
    description: 'Programming help and source code.',
    icon: 'Code',
    filter: (query: any) => query.eq('category', 'coding-discussion')
  },
  'cheat-discussion': {
    title: 'Cheat Discussion',
    description: 'Game cheats and hacks discussion.',
    icon: 'Zap',
    filter: (query: any) => query.in('category', ['cheat-discussion', 'cheats-discussion', 'Cheat Discussion'])
  },
  'cheats-discussion': {
    title: 'Cheats Discussion',
    description: 'Game cheats and hacks discussion.',
    icon: 'Zap',
    filter: (query: any) => query.in('category', ['cheat-discussion', 'cheats-discussion', 'Cheat Discussion'])
  }
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (CATEGORY_SLUGS[id]) {
    return {
      title: `${CATEGORY_SLUGS[id].title} - ByteHack`,
      description: `Browse ${CATEGORY_SLUGS[id].title} threads.`
    }
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) {
    return {
      title: `${id} - ByteHack Forum`,
      description: `Browse ${id} threads.`
    }
  }

  const supabase = await createClient();

  const { data: post } = await supabase
    .from("threads")
    .select(`
      *,
      author:profiles!threads_author_id_fkey(display_name, username)
    `)
    .eq("id", id)
    .single();

  if (!post) {
    return {
      title: "Post Not Found -  ByteHack",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const description = (post.body || "").slice(0, 160) + ((post.body || "").length > 160 ? '...' : '');

  return {
    title: `${post.title} - ByteHack`,
    description,
    openGraph: {
      title: post.title,
      description,
      url: `${baseUrl}/forum/${id}`,
      siteName: 'ByteHack',
      type: 'article',
      publishedTime: post.created_at,
      authors: [post.author?.display_name || post.author?.username || 'Unknown'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  console.log("Forum Page ID:", id);
  console.log("Available slugs:", Object.keys(CATEGORY_SLUGS));

  let categoryConfig = CATEGORY_SLUGS[id] || CATEGORY_SLUGS[id.toLowerCase()];
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!categoryConfig && !isUUID) {
    const user = await getCurrentUser();
    const allowed = await checkCategoryPermission(user?.id || '', resolvedParams.id);
    if (allowed) {
      categoryConfig = {
        title: resolvedParams.id,
        filter: (query: any) => query.eq('category', resolvedParams.id)
      };
    }
  }

  if (categoryConfig) {
    const supabase = await createClient();

    let query = supabase
      .from("threads")
      .select(`
          *,
          author:profiles!threads_author_id_fkey(username, display_name, is_admin, effect_label, avatar_url),
          thread_replies(count),
          thread_likes(count)
        `)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    query = categoryConfig.filter(query);

    const { data: posts } = await query;
    const count = posts?.length || 0;
    const totalViews = posts?.reduce((acc, p) => acc + (p.view_count ?? 0), 0) || 0;

    return (
      <div className="min-h-screen bg-black pt-8">
        <div className="max-w-[1240px] mx-auto px-6">

          {/* Header */}
          <div className="bg-[#050505] border border-white/5 rounded-[32px] p-8 md:p-10 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{categoryConfig.title}</h1>
                <p className="text-white/40 font-medium">Showing {Math.min(count, 3)}-{Math.min(count, 3)} of {count} threads</p>
              </div>

              <div className="flex items-center gap-6 text-xs font-bold text-white/30 uppercase tracking-widest">
                <span>{count} THREADS</span>
                <span>{totalViews} VIEWS</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NewPostButton />
              <Link href="/forum">
                <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 h-10 px-6 rounded-lg font-semibold flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Posts List */}
            <div className="flex-1 space-y-3">
              {posts?.map((post: any) => (
                <a key={post.id} href={`/forum/${post.id}`} className="block group">
                  <div className={`p-5 rounded-[24px] bg-[#0A0A0A] border transition-all duration-200 ${post.pinned ? 'border-[#FFD700]/30 shadow-[0_0_30px_-5px_rgba(255,215,0,0.15)] relative overflow-hidden' : 'border-white/5 hover:border-white/10'}`}>
                    {post.pinned && <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 to-transparent pointer-events-none" />}

                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center flex-shrink-0 text-white/30 hover:text-white transition-colors border border-white/5 relative">
                          <MessageSquare className="w-5 h-5" />
                          {post.pinned && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFD700] rounded-full flex items-center justify-center text-black shadow-lg">
                              <Pin className="w-3 h-3 fill-black transform rotate-45" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-base font-bold truncate pr-4 ${post.pinned ? 'text-[#FFD700]' : 'text-white group-hover:text-white/90'}`}>
                              {post.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                            <span className="text-white/50 uppercase tracking-wide text-[10px] font-bold">by</span>
                            <span className="text-white/70 hover:text-white transition-colors">
                              {(post.author?.username || 'Unknown').length > 15 ? (post.author?.username || 'Unknown').substring(0, 15) + "..." : (post.author?.username || 'Unknown')}
                            </span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 flex-shrink-0 px-4">
                        <div className="text-center w-12 hidden sm:block">
                          <div className={`font-bold text-base ${post.pinned ? 'text-[#FFD700]' : 'text-white'}`}>{post.thread_replies?.[0]?.count ?? post.replies_count ?? 0}</div>
                          <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Replies</div>
                        </div>
                        <div className="text-center w-12 hidden sm:block">
                          <div className={`font-bold text-base ${post.pinned ? 'text-[#FFD700]' : 'text-white'}`}>{post.view_count ?? 0}</div>
                          <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Views</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#151515] flex items-center justify-center text-xs font-bold text-white/60 border border-white/5 ml-2 overflow-hidden">
                          {post.author?.avatar_url ? (
                            <img src={post.author?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            post.author?.username?.[0] || 'U'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Stats Sidebar */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 sticky top-8">
                <h3 className="text-lg font-bold text-white mb-6">Category stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-white/40">Total threads</span>
                    <span className="text-white font-mono">{count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-white/40">Showing</span>
                    <span className="text-white font-mono">{Math.min(count, 50)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <Card className="max-w-md w-full p-8 bg-[#0a0a0a] border-white/10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Lock className="w-10 h-10 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">Authentication Required</h1>
              <p className="text-white/60 text-sm">
                You need to be logged in to access the forum.
              </p>
            </div>

            <Link href="/api/auth/signin" className="w-full">
              <Button className="w-full bg-white text-black hover:bg-white/90 gap-2 font-semibold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign in with Discord
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                Return to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("threads")
    .select(`
      *,
      author:profiles!threads_author_id_fkey(id, username, display_name, is_admin, avatar_url, effect_label, badges, reaction_score),
      thread_replies(
        id,
        body,
        created_at,
        author_id,
        parent_id,
        author:profiles!thread_replies_author_id_fkey(username, display_name, is_admin, avatar_url, effect_label, badges)
      ),
      thread_likes(user_id),
      thread_reactions(id, user_id, emoji, user:profiles(username, avatar_url))
    `)
    .eq("id", resolvedParams.id)
    .single();

  if (postError) {
    console.error("Error fetching post:", postError);
  }

  let fileUploads = [];
  try {
    const { data } = await supabase
      .from("thread_attachments")
      .select(`
        *,
        approver:profiles!approved_by(display_name, username, is_admin, role)
      `)
      .eq("thread_id", resolvedParams.id);

    fileUploads = (data || []).filter((file: any) =>
      file.status === 'approved' ||
      file.uploader_id === user?.id ||
      user?.role === 'admin'
    );
  } catch (error) {
  }

  if (!post && !CATEGORY_SLUGS[resolvedParams.id]) {
    console.error("Post not found:", resolvedParams.id);
    notFound();
  }

  if (!post) {
    return notFound();
  }

  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/forum/${resolvedParams.id}`;
  const isPostOwner = post.author_id === user.id;

  return (
    <div className="min-h-screen bg-black">
      <ViewTracker postId={resolvedParams.id} />

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="max-w-4xl mx-auto">

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">
                <Link href="/forum" className="hover:text-white transition-colors">FORUMS</Link>
                <span>/</span>
                <Link href={`/forum/${post.category?.toLowerCase() === 'general discussion' ? 'general-discussion' : post.category?.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-white transition-colors">
                  {post.category || 'GENERAL'}
                </Link>
                <span>/</span>
                <span className="text-zinc-300 truncate max-w-[200px] md:max-w-md">{post.title}</span>
              </div>

              {/* Post Header */}
              <Card className="p-8 mb-8 bg-[#0a0a0a] border-white/10">

                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight leading-tight break-words break-all">
                      {post.title}
                    </h1>

                    <div className="flex items-center gap-3 text-sm text-white/60 flex-wrap">
                      <Link href={`/user/${post.author.username}`} className="flex items-center gap-3 hover:text-white transition-colors">
                        {post.author.avatar_url && (
                          <img
                            src={post.author.avatar_url}
                            alt={post.author.username}
                            className="w-6 h-6 rounded-full border border-white/10"
                          />
                        )}
                        <StyledUsername
                          name={post.author.display_name || post.author.username}
                          nameColor={undefined}
                          fontStyle={undefined}
                          nameEffect={post.author.effect_label}
                          level={0}
                          role={post.author.is_admin ? "admin" : "user"}
                          isOP={true}
                        />
                      </Link>

                      {post.pinned && (
                        <Badge className="bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/20 border border-[#FFD700]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm h-5">
                          Pinned
                        </Badge>
                      )}

                      {post.locked && (
                        <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm h-5">
                          Locked
                        </Badge>
                      )}

                      <span className="text-white/30">•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="text-white/30">•</span>
                      <span>{post.view_count ?? 0} views</span>
                    </div>
                  </div>

                  {isPostOwner && (
                    <PostActions
                      postId={post.id}
                      initialTitle={post.title}
                      initialContent={post.body}
                    />
                  )}
                </div>

                <div className="prose prose-invert max-w-none mb-4 post-content font-proggy text-base leading-relaxed break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ node, ...props }: any) => (
                        <div className="relative">
                          <pre {...props} className="bg-[#111] border border-white/10 p-4 rounded-lg overflow-x-auto" />
                        </div>
                      ),
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !className?.includes('language-') ? (
                          <code {...props} className="bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono text-[#FFD700]">
                            {children}
                          </code>
                        ) : (
                          <code {...props} className={className}>
                            {children}
                          </code>
                        )
                      },
                      a: ({ node, ...props }: any) => (
                        <a {...props} className="text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer" />
                      ),
                      img: ({ node, ...props }: any) => (
                        <img {...props} className="rounded-lg border border-white/10 max-h-[500px] object-contain" />
                      ),
                      blockquote: ({ node, ...props }: any) => (
                        <blockquote {...props} className="border-l-4 border-primary/50 pl-4 italic text-white/60 bg-white/5 py-2 pr-4 rounded-r-lg" />
                      ),
                      table: ({ node, ...props }: any) => (
                        <div className="overflow-x-auto my-4 border border-white/10 rounded-lg">
                          <table {...props} className="w-full text-left border-collapse" />
                        </div>
                      ),
                      th: ({ node, ...props }: any) => (
                        <th {...props} className="border-b border-white/10 bg-white/5 p-3 text-sm font-bold text-white" />
                      ),
                      h1: ({ node, ...props }: any) => (
                        <h1 {...props} className="text-3xl font-bold text-white mt-6 mb-4 border-b border-white/10 pb-2" />
                      ),
                      h2: ({ node, ...props }: any) => (
                        <h2 {...props} className="text-2xl font-bold text-white mt-5 mb-3" />
                      ),
                      h3: ({ node, ...props }: any) => (
                        <h3 {...props} className="text-xl font-bold text-white mt-4 mb-2" />
                      ),
                      h4: ({ node, ...props }: any) => (
                        <h4 {...props} className="text-lg font-bold text-white mt-4 mb-2" />
                      ),
                      td: ({ node, ...props }: any) => (
                        <td {...props} className="border-b border-white/5 p-3 text-sm text-white/80" />
                      )
                    }}
                  >
                    {post.body}
                  </ReactMarkdown>
                </div>

                {fileUploads && fileUploads.length > 0 && (
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-white">
                      <FileIcon className="h-4 w-4" />
                      Attachments ({fileUploads.length})
                    </h3>
                    <div className="space-y-2">
                      {fileUploads.map((file: any) => (
                        <Card key={file.id} className="p-3 bg-[#050505] border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileIcon className="h-5 w-5 text-zinc-400" />
                              <div>
                                <div className="flex items-center gap-2">
                                  {file.status === 'approved' ? (
                                    <a
                                      href={file.public_url}
                                      className="font-medium hover:underline text-white text-sm"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {file.description || file.file_name}
                                    </a>
                                  ) : (
                                    <span className="font-medium text-zinc-500 text-sm cursor-not-allowed">
                                      {file.description || file.file_name}
                                    </span>
                                  )}

                                  {file.status !== 'approved' && (
                                    <Badge variant="outline" className={`text-[10px] h-5 ${file.status === 'pending' ? 'text-yellow-500 border-yellow-500/20' : 'text-red-500 border-red-500/20'}`}>
                                      {file.status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5">
                                  {(file.file_size / 1024 / 1024).toFixed(2)} MB • {file.content_type?.split('/')[1] || 'file'}
                                </div>
                              </div>
                            </div>

                            {file.status === 'approved' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-white/10 hover:bg-white/10 text-white"
                                asChild
                              >
                                <a
                                  href={file.public_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download
                                </a>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-white/10 text-zinc-500 cursor-not-allowed hover:bg-transparent hover:text-zinc-500"
                                disabled
                              >
                                {file.status === 'pending' ? 'Pending' : 'Denied'}
                              </Button>
                            )}
                          </div>

                          <div className="mt-2 p-2 bg-black/40 rounded border border-white/5">
                            <div className="text-[10px] font-mono space-y-2">
                              <div>
                                <div className="font-semibold text-zinc-500 mb-0.5 uppercase tracking-wider">SHA-256</div>
                                <div className="break-all text-zinc-400 select-all">
                                  {file.sha256}
                                </div>
                              </div>

                              {file.status === 'approved' && file.approver && (
                                <div className="pt-2 border-t border-white/5">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="font-semibold text-green-500 mb-0.5 uppercase tracking-wider flex items-center gap-1.5">
                                      <CheckCircle className="w-3 h-3" />
                                      Approved
                                    </div>
                                    <div className="text-zinc-400">
                                      ByType <span className="text-zinc-300 font-bold">{file.approver.display_name || file.approver.username}</span>
                                    </div>
                                    <div className="text-zinc-500">
                                      {file.approved_at ? formatDistanceToNow(new Date(file.approved_at), { addSuffix: true }) : 'Recently'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                      }
                    </div >
                  </div >
                )}

                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                  <PostReactions
                    postId={post.id}
                    initialReactions={post.thread_reactions || []}
                    currentUserId={user?.id}
                    currentUser={user ? { username: user.username, avatar_url: user.avatar_url } : undefined}
                  />
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {post.thread_replies?.length || 0}
                    </Button>
                    <ShareButton url={postUrl} title={post.title} />
                  </div>
                </div>
              </Card >

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Comments</h2>
                <CommentSection
                  postId={post.id}
                  postAuthorId={post.author_id}
                  comments={post.thread_replies || []}
                  currentUserId={user.id}
                  isLocked={post.locked}
                />
              </Card>
            </div >
          </div >
        </div >
      </div >
    </div >
  );
}
