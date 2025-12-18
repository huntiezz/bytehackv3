import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, MessageSquare, Code2, User, Eye, Award, MessageCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { getCurrentUser } from "@/lib/auth";
import { BanUserButton } from "@/components/ban-user-button";

export const revalidate = 30;

const getFontFamily = (style: string): string => {
  const fontMap: Record<string, string> = {
    'default': 'inherit',
    'mono': 'monospace',
    'serif': 'serif',
    'proggy': "'ProggyCleanTT', monospace",
    'arial': 'Arial, sans-serif',
    'helvetica': 'Helvetica, Arial, sans-serif',
    'times': "'Times New Roman', Times, serif",
    'georgia': 'Georgia, serif',
    'courier': "'Courier New', Courier, monospace",
    'verdana': 'Verdana, Geneva, sans-serif',
    'trebuchet': "'Trebuchet MS', sans-serif",
    'impact': 'Impact, Charcoal, sans-serif',
    'comic': "'Comic Sans MS', cursive, sans-serif",
    'palatino': "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    'garamond': 'Garamond, serif',
    'bookman': "'Bookman Old Style', serif",
    'candara': 'Candara, sans-serif',
    'consolas': 'Consolas, monospace',
    'monaco': 'Monaco, monospace',
    'lucida': "'Lucida Console', Monaco, monospace",
    'rockwell': 'Rockwell, serif',
    'copperplate': 'Copperplate, Fantasy',
    'brush': "'Brush Script MT', cursive",
  };
  return fontMap[style] || 'inherit';
};

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    return {
      title: "User Not Found - ByteHack",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const displayName = profile.display_name || profile.name;
  const description = profile.bio
    ? `${displayName} - ${profile.bio.slice(0, 160)}`
    : `${displayName}'s profile on ByteHck`;

  return {
    title: `${displayName} (@${username}) - Bytehack`,
    description,
    openGraph: {
      title: displayName,
      description,
      url: `${baseUrl}/user/${username}`,
      siteName: 'ByteHack',
      type: 'profile',
      images: profile.profile_picture ? [profile.profile_picture] : [],
    },
    twitter: {
      card: 'summary',
      title: displayName,
      description,
    },
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    notFound();
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      comments(count),
      likes(count)
    `)
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: offsets } = await supabase
    .from("offsets")
    .select("*")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      post:posts(id, title)
    `)
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const registeredDays = Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));

  const getLevelBadge = (level: number) => {
    if (level >= 3) return { text: "MVP", color: "bg-orange-500" };
    if (level >= 2) return { text: `Level ${level}`, color: "bg-blue-500" };
    if (level >= 1) return { text: `Level ${level}`, color: "bg-green-500" };
    return null;
  };

  const levelBadge = getLevelBadge(profile.level || 0);

  return (
    <div className="min-h-screen">
      <ProfileViewTracker profileId={profile.id} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card className="p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-secondary/30 flex-shrink-0">
              {profile.profile_picture ? (
                <Image
                  src={profile.profile_picture}
                  alt={profile.display_name || profile.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1
                      className="text-3xl font-bold"
                      style={{
                        color: profile.name_color || '#ffffff',
                        fontFamily: getFontFamily(profile.font_style || 'default'),
                      }}
                    >
                      {(profile.display_name || profile.name).length > 15 ? (profile.display_name || profile.name).substring(0, 15) + "..." : (profile.display_name || profile.name)}
                    </h1>
                    {levelBadge && (
                      <Badge className={`${levelBadge.color} text-white`}>
                        {levelBadge.text}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profile.username.length > 15 ? profile.username.substring(0, 15) + "..." : profile.username}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant={profile.role === 'admin' ? 'destructive' : profile.role === 'offset_updater' ? 'default' : 'secondary'}>
                    {profile.role || 'member'}
                  </Badge>
                  {profile.level >= 2 && profile.profile_decoration && (
                    <span className="text-xs text-muted-foreground">{profile.profile_decoration}</span>
                  )}
                  {currentUser && currentUser.role === 'admin' && currentUser.id !== profile.id && (
                    <BanUserButton
                      userId={profile.id}
                      username={profile.username || profile.name}
                      currentUserRole={currentUser.role}
                    />
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(profile.created_at), 'MMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{registeredDays} days ago</span>
                </div>
                {profile.discord_username && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>{profile.discord_username}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{posts?.length || 0} Posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  <span>{offsets?.length || 0} Offsets</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{comments?.length || 0} Comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.profile_views || 0} Profile Views</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="posts">
              <MessageSquare className="h-4 w-4 mr-2" />
              Posts ({posts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="offsets">
              <Code2 className="h-4 w-4 mr-2" />
              Offsets ({offsets?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments ({comments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-3">
            {!posts || posts.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No posts yet
              </Card>
            ) : (
              posts.map((post: any) => (
                <Link key={post.id} href={`/forum/post/${post.id}`}>
                  <Card className="p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{post.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="outline">{post.category}</Badge>
                          <span>{post.comments?.[0]?.count || 0} comments</span>
                          <span>{post.likes?.[0]?.count || 0} likes</span>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="offsets" className="space-y-3">
            {!offsets || offsets.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No offsets yet
              </Card>
            ) : (
              offsets.map((offset: any) => (
                <Link key={offset.id} href={`/offsets/${offset.id}`}>
                  <Card className="p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">{offset.game_name}</h3>
                        <p className="text-sm text-muted-foreground">Version: {offset.version}</p>
                        {offset.description && (
                          <p className="text-sm text-muted-foreground mt-1">{offset.description}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(offset.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-3">
            {!comments || comments.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No comments yet
              </Card>
            ) : (
              comments.map((comment: any) => (
                <Link key={comment.id} href={`/forum/post/${comment.post_id}`}>
                  <Card className="p-4 hover:border-primary transition-colors">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Commented on <span className="font-medium text-foreground">{comment.post?.title}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
