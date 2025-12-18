import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { OffsetForm } from "@/components/offset-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { Shield, Lock } from "lucide-react";
import Link from "next/link";


export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OffsetUpdaterPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Offset Updater Access</h1>
            <p className="text-muted-foreground">
              Sign in with Discord to access the offset updater panel
            </p>
          </div>
          <Link href="/api/auth/signin">
            <Button size="lg" className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Sign in with Discord
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user.role !== "offset_updater" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <Lock className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You need the <Badge variant="secondary">offset_updater</Badge> or <Badge variant="secondary">admin</Badge> role to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Current role: <Badge variant="outline">{user.role || 'member'}</Badge>
            </p>
          </div>
          <Link href="/forum">
            <Button variant="outline" className="w-full">
              Back to Forum
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: myOffsets } = await supabase
    .from("offsets")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">Offset Updater Panel</h1>
            <Badge variant="secondary">Verified Updater</Badge>
          </div>
          <p className="text-muted-foreground">
            Post and manage game offsets for the community.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Post New Offset</h2>
            <OffsetForm />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Your Recent Offsets</h2>
            <div className="space-y-3">
              {!myOffsets || myOffsets.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  No offsets posted yet.
                </Card>
              ) : (
                myOffsets.map((offset: any) => (
                  <Card key={offset.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{offset.game_name}</h3>
                        <div className="text-sm text-muted-foreground">
                          {offset.version} • {formatDistanceToNow(new Date(offset.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Published</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
