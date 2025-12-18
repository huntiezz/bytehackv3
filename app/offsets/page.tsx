import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Clock, Eye, ThumbsUp, Download, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { UserLink } from "@/components/user-link";

export default async function OffsetsPage() {
  const supabase = await createClient();

  const { data: allOffsets } = await supabase
    .from("offsets")
    .select(`
      *,
      author:profiles!offsets_author_id_fkey(name, username, role),
      offset_likes(id)
    `)
    .order("created_at", { ascending: false });

  const latestOffsets = new Map();
  const gameLikes = new Map();

  allOffsets?.forEach((offset: any) => {
    const gameName = offset.game_name;
    
    if (!latestOffsets.has(gameName) || 
        new Date(offset.created_at) > new Date(latestOffsets.get(gameName).created_at)) {
      latestOffsets.set(gameName, offset);
    }
    
    const currentLikes = gameLikes.get(gameName) || [];
    gameLikes.set(gameName, [...currentLikes, ...(offset.offset_likes || [])]);
  });

  const offsets = Array.from(latestOffsets.values()).map((offset: any) => ({
    ...offset,
    offset_likes: gameLikes.get(offset.game_name) || []
  })).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Game Offsets</h1>
          <p className="text-muted-foreground">
            Latest memory offsets for supported games. Updated regularly by verified contributors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!offsets || offsets.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground col-span-full">
              No offsets available yet.
            </Card>
          ) : (
            offsets.map((offset: any) => (
              <Link key={offset.id} href={`/offsets/${offset.id}`}>
                <Card className="group overflow-hidden hover:border-primary transition-all cursor-pointer h-full hover:shadow-lg">
                  {/* Game Image */}
                  <div className="relative w-full h-56 bg-black/5 overflow-hidden">
                    {offset.image_url ? (
                      <Image
                        src={offset.image_url}
                        alt={offset.game_name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-20 w-20 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    {/* Title */}
                    <div>
                      <h3 className="font-bold text-xl tracking-tight uppercase">{offset.game_name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Game Version: <span className="font-semibold text-foreground">{offset.version}</span>
                      </p>
                    </div>

                    {/* Description */}
                    {offset.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {offset.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{offset.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{offset.offset_likes?.length || 0}</span>
                      </div>
                      {(offset.sdk_dump_url || offset.mem_dump_url) && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <Download className="h-4 w-4" />
                          <span className="font-medium">Downloads</span>
                        </div>
                      )}
                    </div>

                    {/* Last Updated & Author */}
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Updated {formatDistanceToNow(new Date(offset.updated_at), { addSuffix: true })}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by <UserLink 
                          username={offset.author?.username}
                          name={offset.author?.name || "Unknown"}
                          role={offset.author?.role}
                          showRole={false}
                          useProggyFont={true}
                          className="font-medium text-foreground"
                          asPlainText={true}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
