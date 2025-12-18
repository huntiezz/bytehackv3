"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface UserBanStatusProps {
  userId: string;
  username: string;
  userIp?: string;
  currentUserRole?: string;
}

export function UserBanStatus({
  userId,
  username,
  userIp,
  currentUserRole,
}: UserBanStatusProps) {
  const [loading, setLoading] = useState(false);
  const [checkingBan, setCheckingBan] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [isIpBlacklisted, setIsIpBlacklisted] = useState(false);
  const [banInfo, setBanInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const res = await fetch("/api/check-ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ipAddress: userIp }),
        });
        const data = await res.json();
        
        if (data.isBanned) {
          setBanInfo(data);
          if (data.type === 'banned') {
            setIsBanned(true);
          } else if (data.type === 'blacklisted') {
            setIsIpBlacklisted(true);
          }
        }
      } catch (error) {
        console.error("Error checking ban status:", error);
      } finally {
        setCheckingBan(false);
      }
    };

    if (currentUserRole === "admin") {
      checkBanStatus();
    }
  }, [userId, userIp, currentUserRole]);

  const handleUnban = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/ban-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`User ${username} has been unbanned`);
        setIsBanned(false);
        setBanInfo(null);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to unban user");
      }
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanIp = async () => {
    if (!userIp) {
      toast.error("No IP address available");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/unban-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: userIp }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`IP ${userIp} has been removed from blacklist`);
        setIsIpBlacklisted(false);
        setBanInfo(null);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to remove IP blacklist");
      }
    } catch (error) {
      console.error("Error removing IP blacklist:", error);
      toast.error("Failed to remove IP blacklist");
    } finally {
      setLoading(false);
    }
  };

  if (currentUserRole !== "admin" || checkingBan) {
    return null;
  }

  if (!isBanned && !isIpBlacklisted) {
    return null;
  }

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-destructive">
            {isIpBlacklisted ? 'IP Blacklisted' : 'Account Banned'}
          </h4>
          
          {banInfo && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Reason:</span>
                <span>{banInfo.reason}</span>
              </div>
              {banInfo.bannedBy && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">By:</span>
                  <span>{banInfo.bannedBy}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant={banInfo.isPermanent ? "destructive" : "outline"}>
                  {banInfo.isPermanent ? "Permanent" : "Temporary"}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {isBanned && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnban}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Unbanning...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Unban Account
              </>
            )}
          </Button>
        )}
        
        {isIpBlacklisted && userIp && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnbanIp}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Remove IP Blacklist
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
