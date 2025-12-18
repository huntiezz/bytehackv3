import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ThumbsUp, Clock, User, Code2, Copy, Check, Download, Image as ImageIcon, FileCode, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { OffsetDownloadButton } from "@/components/offset-download-button";
import { OffsetViewTracker } from "@/components/offset-view-tracker";
import { UserLink } from "@/components/user-link";
import { OffsetLikeButton } from "@/components/offset-like-button";
import { getCurrentUser } from "@/lib/auth";
import { CopyOffsetButton } from "@/components/copy-offset-button";
import { CodeBlock } from "@/components/code-block";

export default async function OffsetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: offset } = await supabase
    .from("offsets")
    .select(`
      *,
      author:profiles!offsets_author_id_fkey(name, username, discord_username, role),
      offset_likes(id, user_id)
    `)
    .eq("id", resolvedParams.id)
    .single();

  if (!offset) {
    notFound();
  }

  const { data: allVersions } = await supabase
    .from("offsets")
    .select("id, version, created_at, updated_at")
    .eq("game_name", offset.game_name)
    .order("created_at", { ascending: false });

  const versionIds = allVersions?.map(v => v.id) || [offset.id];

  const { data: allLikes } = await supabase
    .from("offset_likes")
    .select("*")
    .in("offset_id", versionIds);

  const isLiked = currentUser && allLikes ? allLikes.some((like: any) => like.user_id === currentUser.id) : false;
  const totalLikes = allLikes?.length || 0;

  const canEdit = currentUser && (currentUser.role === 'offset_updater' || currentUser.role === 'admin');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <OffsetViewTracker offsetId={resolvedParams.id} />
      
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/offsets" className="hover:text-foreground transition-colors">Offsets</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{offset.game_name}</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column - Game Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hero Card */}
            <Card className="overflow-hidden border-2">
              <div className="flex flex-col md:flex-row">
                {/* Game Image */}
                {offset.image_url && (
                  <div className="relative w-full md:w-56 h-64 md:h-72 flex-shrink-0 bg-black/5">
                    <Image
                      src={offset.image_url}
                      alt={offset.game_name}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                )}

                {/* Game Info */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-3">{offset.game_name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                      <span>[Game version: {offset.version}]</span>
                      <span className="flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        [{Object.keys(offset.offset_data || {}).length} {Object.keys(offset.offset_data || {}).length === 1 ? 'Offset' : 'Offsets'}]
                      </span>
                    </div>

                    {offset.description && (
                      <p className="text-muted-foreground leading-relaxed">{offset.description}</p>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-6 text-sm mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{offset.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>by</span>
                      <UserLink 
                        username={offset.author?.username}
                        name={offset.author?.name || "Unknown"}
                        role={offset.author?.role}
                        showRole={true}
                      />
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDistanceToNow(new Date(offset.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Offset Data Card */}
            <Card>
              <div className="border-b px-4 py-3 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Offset Data
                  </h2>
                  <CopyOffsetButton data={offset.offset_data} />
                </div>
              </div>
              <div className="p-4">
                <div className="bg-black/50 rounded-lg p-3 border border-primary/20">
                  <pre className="overflow-x-auto text-xs font-mono leading-snug">
                    <code className="language-cpp">
                      {Object.entries(offset.offset_data || {}).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-purple-400">constexpr</span>{' '}
                          <span className="text-blue-400">uintptr_t</span>{' '}
                          <span className="text-green-400">{key}</span>{' '}
                          <span className="text-gray-400">=</span>{' '}
                          <span className="text-orange-400">{String(value)}</span>
                          <span className="text-gray-400">;</span>
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>
            </Card>

            {/* Structures & Functions */}
            {offset.structures && (
              <Card>
                <div className="border-b px-4 py-3 bg-secondary/30">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Structures & Functions
                  </h2>
                </div>
                <div className="p-4">
                  <div className="bg-black/50 rounded-lg p-3 border border-primary/20">
                    <CodeBlock code={offset.structures} />
                  </div>
                </div>
              </Card>
            )}

            {/* Dump Images */}
            {offset.dump_images && offset.dump_images.length > 0 && (
              <Card>
                <div className="border-b px-6 py-4 bg-secondary/30">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Dump Screenshots
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {offset.dump_images.map((url: string, index: number) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={url}
                          alt={`Dump screenshot ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Notes */}
            {offset.notes && (
              <Card>
                <div className="border-b px-6 py-4 bg-secondary/30">
                  <h2 className="text-lg font-semibold">Additional Notes</h2>
                </div>
                <div className="p-6">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {offset.notes}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Actions & Downloads */}
          <div className="space-y-3">
            {/* Actions Card */}
            <Card>
              <div className="border-b px-4 py-2.5 bg-secondary/30">
                <h3 className="text-sm font-semibold">Actions</h3>
              </div>
              <div className="p-3 space-y-2">
                <OffsetLikeButton
                  offsetId={offset.id}
                  initialLikes={totalLikes}
                  initialLiked={isLiked}
                />
                
                {/* Download Files */}
                {offset.sdk_dump_url && (
                  <OffsetDownloadButton
                    url={offset.sdk_dump_url}
                    label="SDK Dump"
                    variant="default"
                  />
                )}
                {offset.mem_dump_url && (
                  <OffsetDownloadButton
                    url={offset.mem_dump_url}
                    label="Memory Dump"
                    variant="secondary"
                  />
                )}
              </div>
            </Card>

            {/* Info Card */}
            <Card>
              <div className="border-b px-4 py-2.5 bg-secondary/30">
                <h3 className="text-sm font-semibold">Information</h3>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div>
                  <div className="text-muted-foreground mb-0.5">Game Version</div>
                  <div className="font-mono font-semibold text-sm">{offset.version}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Total Offsets</div>
                  <div className="font-semibold text-sm">{Object.keys(offset.offset_data || {}).length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Last Updated</div>
                  <div className="font-semibold text-sm">
                    {new Date(offset.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Created</div>
                  <div className="font-semibold text-sm">
                    {new Date(offset.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Version History */}
            {allVersions && allVersions.length > 1 && (
              <Card>
                <div className="border-b px-4 py-2.5 bg-secondary/30">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Version History ({allVersions.length})
                  </h3>
                </div>
                <div className="p-3 space-y-1.5">
                  {allVersions.map((version: any) => (
                    <Link
                      key={version.id}
                      href={`/offsets/${version.id}`}
                      className={`block p-2 rounded border transition-colors text-sm ${
                        version.id === offset.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-secondary/50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono font-semibold text-sm">v{version.version}</div>
                        {version.id === offset.id && (
                          <Badge variant="default" className="text-xs px-1.5 py-0">Current</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Update for Updaters */}
            {canEdit && (
              <Card>
                <div className="border-b px-4 py-2.5 bg-secondary/30">
                  <h3 className="text-sm font-semibold">Updater Actions</h3>
                </div>
                <div className="p-3">
                  <Link href={`/offsets/update?game=${encodeURIComponent(offset.game_name)}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Code2 className="h-3.5 w-3.5 mr-2" />
                      Add New Version
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
