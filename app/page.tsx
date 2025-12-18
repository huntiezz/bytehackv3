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
    <div className="min-h-screen bg-background">

      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background pointer-events-none" />

        <div className="max-w-4xl mx-auto relative text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            The Underground.t <br />
            <span className="text-primary">Development Community</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers sharing extensive game knowledge,
            reverse engineering tools, and cutting-edge offsets.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {user ? (
              <Link href="/forum">
                <Button size="lg" className="rounded-full px-8 h-12 text-base">
                  Enter Forum
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-8 h-12 text-base">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>


      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Discussions
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                See what the community is talking about right now
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts?.map((post) => {
              const author = Array.isArray(post.users) ? post.users[0] : post.users;

              return (
                <Link
                  key={post.id}
                  href={user ? `/forum/post/${post.id}` : "/login"}
                  className="group block h-full"
                >
                  <Card className="h-full border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
                    {!user && (
                      <div className="absolute top-3 right-3 z-10">
                        <Lock className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage src={author?.avatar_url} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {author?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground font-medium">
                          {author?.username || "Anonymous"}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="relative">
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900/50 to-transparent" />
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs text-muted-foreground gap-4">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>View Thread</span>
                        </div>
                        <div className="ml-auto">
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}


            {(!posts || posts.length === 0) && [1, 2, 3].map((i) => (
              <div key={i} className="h-full p-6 text-center border border-dashed rounded-xl border-zinc-800 flex flex-col items-center justify-center text-muted-foreground">
                <Lock className="h-8 w-8 mb-3 opacity-20" />
                <p>Private Discussion</p>
              </div>
            ))}
          </div>

          {!user && (
            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">You are missing out on 800+ exclusive threads</p>
              <Link href="/register">
                <Button variant="outline" className="rounded-full">
                  Join the Conversation
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-6 border-t border-white/5 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="h-10 w-10 mx-auto bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Active Community</h3>
              <p className="text-sm text-muted-foreground">Connect with passionate developers</p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 mx-auto bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Daily Updates</h3>
              <p className="text-sm text-muted-foreground">New offsets and tools dropped daily</p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 mx-auto bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Invite-only access ensures quality</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
