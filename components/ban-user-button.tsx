"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Ban, Shield, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface BanUserButtonProps {
  userId: string;
  username: string;
  currentUserRole?: string;
  fullWidth?: boolean;
}

export function BanUserButton({
  userId,
  username,
  currentUserRole,
  fullWidth = false,
}: BanUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingBan, setCheckingBan] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [isIpBlacklisted, setIsIpBlacklisted] = useState(false);
  const [banInfo, setBanInfo] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [blacklistIp, setBlacklistIp] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const res = await fetch("/api/check-ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        setIsBanned(data.isBanned && data.type === 'banned');
        setIsIpBlacklisted(data.isBanned && data.type === 'blacklisted');
        if (data.isBanned) {
          setBanInfo(data);
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
  }, [userId, currentUserRole]);

  if (currentUserRole !== "admin") {
    return null;
  }

  if (checkingBan) {
    return null;
  }

  const handleBan = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the ban");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          reason: reason.trim(),
          durationHours,
          blacklistIp,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `User ${username} has been banned${blacklistIp ? " and IP blacklisted" : ""}`
        );
        setOpen(false);
        setIsBanned(true);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to ban user");
      }
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    } finally {
      setLoading(false);
    }
  };

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

  const handleUnbanIp = async (ipAddress: string) => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/unban-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`IP ${ipAddress} has been removed from blacklist`);
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

  if (isBanned) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={fullWidth ? "w-full" : ""}
        onClick={handleUnban}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Unbanning...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Unban User
          </>
        )}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className={fullWidth ? "w-full" : ""}>
          <Ban className="w-4 h-4 mr-2" />
          Ban User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Ban User: {username}
          </DialogTitle>
          <DialogDescription>
            This will ban the user from accessing the platform. Their IP address
            can also be blacklisted to prevent account creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="reason"
              placeholder="Spam, harassment, inappropriate content, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium">
              Ban Duration (hours)
            </label>
            <Input
              id="duration"
              type="number"
              min="1"
              placeholder="Leave empty for permanent ban"
              value={durationHours || ""}
              onChange={(e) =>
                setDurationHours(e.target.value ? parseInt(e.target.value) : null)
              }
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for a permanent ban. Enter hours for temporary ban (e.g., 24, 168 for 1 week)
            </p>
          </div>

          {/* IP Blacklist Option */}
          <div className="flex items-center space-x-2">
            <input
              id="blacklist-ip"
              type="checkbox"
              checked={blacklistIp}
              onChange={(e) => setBlacklistIp(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="blacklist-ip" className="cursor-pointer text-sm font-medium">
              Also blacklist user's IP address
            </label>
          </div>

          {/* Quick Durations */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Select</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDurationHours(24)}
                disabled={loading}
              >
                1 Day
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDurationHours(168)}
                disabled={loading}
              >
                1 Week
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDurationHours(720)}
                disabled={loading}
              >
                1 Month
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDurationHours(null)}
                disabled={loading}
              >
                Permanent
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleBan}
            disabled={loading || !reason.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Banning...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
