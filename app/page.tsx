import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, ArrowRight, Lock, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      created_at,
      users (
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">

      {/* Hero Section */}
      <section className="relative py-32 md:py-48 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-black to-black pointer-events-none" />

        <div className="max-w-5xl mx-auto relative text-center space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Systems Operational
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
            The Standard for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Security Research.</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A private community dedicated to reverse engineering, software analysis, and low-level development.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {user ? (
              <Link href="/forum">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200">
                  Enter Platform
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200">
                    Join Community
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg font-bold border-white/10 hover:bg-white/5 text-white">
                    Documentation
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Community Feed Preview */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Latest activity</h2>
              <p className="text-zinc-500">Real-time discussions from the community.</p>
            </div>
            <Link href="/forum">
              <Button variant="ghost" className="text-zinc-400 hover:text-white group">
                View all threads
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts?.map((post) => {
              const author = Array.isArray(post.users) ? post.users[0] : post.users;
              return (
                <Link
                  key={post.id}
                  href={user ? `/forum/post/${post.id}` : "/login"}
                  className="group block"
                >
                  <Card className="h-full border-white/5 bg-[#0A0A0A] hover:bg-[#111] transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-6 w-6 border border-white/10">
                          <AvatarImage src={author?.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-white/5 text-zinc-400">
                            {author?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-zinc-500 font-mono">
                          @{author?.username || "anonymous"}
                        </span>
                        <span className="text-xs text-zinc-700 ml-auto">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}

            {(!posts || posts.length === 0) && [1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-xl border border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Restricted Access</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust/Stats */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-4xl font-bold text-white mb-2">10k+</div>
            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide">Members</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">500+</div>
            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide">Tools</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">24/7</div>
            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide">Uptime</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">Zero</div>
            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide">Logs</div>
          </div>
        </div>
      </section>

    </div>
  );
}
