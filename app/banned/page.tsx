import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, User, FileText } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BanCheckButton } from "@/components/ban-check-button";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function BannedPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    reason?: string;
    bannedBy?: string;
    expiresAt?: string;
    isPermanent?: string;
  }>;
}) {
  const params = await searchParams;

  const headersList = await headers();
  const cookieStore = await cookies();
  const forwarded = headersList.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "unknown";
  const userId = cookieStore.get("user_id")?.value;

  const supabase = await createClient();

  let isBanned = false;
  if (userId) {
    const { data: banData } = await supabase.rpc('is_user_banned', {
      check_user_id: userId
    });
    if (banData && banData.length > 0 && banData[0].is_banned) {
      isBanned = true;
    }
  }

  if (!isBanned) {
    const { data: ipData } = await supabase.rpc('is_ip_blacklisted', {
      check_ip: ipAddress
    });
    if (ipData && ipData.length > 0 && ipData[0].is_blacklisted) {
      isBanned = true;
    }
  }

  if (!isBanned) {
    redirect("/");
  }
  const {
    type = 'banned',
    reason = 'Violation of community guidelines',
    bannedBy = 'System',
    expiresAt,
    isPermanent = 'true'
  } = params;

  const isBlacklisted = type === 'blacklisted';
  const isPerm = isPermanent === 'true';
  const expirationDate = expiresAt ? new Date(expiresAt) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isBlacklisted ? 'You Have Been Blacklisted' : 'You Have Been Banned'}
            </h1>
            <Badge variant="destructive" className="text-sm">
              {isBlacklisted ? 'IP BLACKLISTED' : 'ACCOUNT BANNED'}
            </Badge>
          </div>

          {/* Ban Information */}
          <div className="w-full space-y-4 mt-8">
            {/* Reason */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-left flex-1">
                  <h3 className="font-semibold mb-1">Reason</h3>
                  <p className="text-muted-foreground">{reason}</p>
                </div>
              </div>
            </div>

            {/* Time Left */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-left flex-1">
                  <h3 className="font-semibold mb-1">Time Left</h3>
                  <p className="text-muted-foreground">
                    {isPerm ? (
                      <span className="text-destructive font-semibold">Permanent</span>
                    ) : expirationDate ? (
                      <>
                        Expires {formatDistanceToNow(expirationDate, { addSuffix: true })}
                        <span className="text-xs block mt-1">
                          {expirationDate.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      'No expiration set'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Banned By */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-left flex-1">
                  <h3 className="font-semibold mb-1">
                    {isBlacklisted ? 'Blacklisted By' : 'Banned By'}
                  </h3>
                  <p className="text-muted-foreground">{bannedBy}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {isBlacklisted ? (
                <>
                  Your IP address has been blacklisted from accessing this platform.
                  If you believe this is a mistake, please contact support.
                </>
              ) : (
                <>
                  Your account has been suspended from accessing this platform.
                  If you believe this is a mistake or would like to appeal,
                  please contact support.
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            <BanCheckButton />
            <Button variant="outline" asChild>
              <Link href="/api/auth/signout">
                Sign Out
              </Link>
            </Button>
            {!isPerm && expirationDate && (
              <Button variant="secondary" asChild>
                <Link href="/">
                  Return Home
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
