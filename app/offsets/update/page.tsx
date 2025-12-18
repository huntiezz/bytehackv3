import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { UpdateOffsetForm } from "@/components/update-offset-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function UpdateOffsetPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user || (user.role !== "offset_updater" && user.role !== "admin")) {
    redirect("/offsets");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/offsets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Offsets
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {params.game ? `Update ${params.game}` : "Publish New Offset"}
          </h1>
          <p className="text-muted-foreground">
            {params.game
              ? "Add a new version for this game"
              : "Share offset data with the community"}
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <UpdateOffsetForm gameName={params.game} />
        </Suspense>
      </div>
    </div>
  );
}
