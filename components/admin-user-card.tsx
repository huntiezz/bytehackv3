"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronDown, ChevronUp, UserPlus, Mail, Calendar, Clock, MapPin, Shield, Activity, Award } from "lucide-react";
import { BanUserButton } from "./ban-user-button";
import { UserBanStatus } from "./user-ban-status";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { BADGES_CONFIG } from "@/lib/badges";

interface UserCardProps {
  user: any;
  onInviteToServer?: (userId: string) => void;
  currentUserRole?: string;
}

export function AdminUserCard({ user, onInviteToServer, currentUserRole }: UserCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const lastSession = user.sessions?.[0];
  const registeredDays = Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

  const handleRoleUpdate = async (newRole: string) => {
    if (newRole === user.role) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      toast.success(`Updated role to ${newRole}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBadgeToggle = async (badgeId: string) => {
    setIsLoading(true);
    const currentBadges = Array.isArray(user.badges) ? user.badges : [];
    let newBadges;
    if (currentBadges.includes(badgeId)) {
      newBadges = currentBadges.filter((b: string) => b !== badgeId);
    } else {
      newBadges = [...currentBadges, badgeId];
    }

    try {
      const res = await fetch("/api/admin/update-badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, badges: newBadges }),
      });

      if (!res.ok) {
        throw new Error("Failed to update badges");
      }

      toast.success("Badges updated");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="font-semibold text-lg">{user.name}</div>
              <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'offset_updater' ? 'default' : 'secondary'}>
                {user.role || 'member'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="font-mono">{user.email || "No email"}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Registered {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
                <span className="text-muted-foreground/60">({registeredDays}d)</span>
              </div>
              {user.last_login && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last seen {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="pt-4 border-t space-y-4">
            {/* Ban Status */}
            <UserBanStatus
              userId={user.id}
              username={user.username || user.name}
              userIp={lastSession?.ip_address || user.last_ip}
              currentUserRole={currentUserRole}
            />

            {/* Role Management */}
            {/* Role & Badge Management */}
            {currentUserRole === 'admin' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Role Management
                  </h4>
                  <div className="max-w-[200px]">
                    <Select
                      defaultValue={user.role || 'member'}
                      onValueChange={handleRoleUpdate}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="offset_updater">Offset Updater</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Badges
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(BADGES_CONFIG).map(([key, config]) => {
                      const isHas = user.badges?.includes(key);
                      return (
                        <Button
                          key={key}
                          variant={isHas ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleBadgeToggle(key)}
                          disabled={isLoading}
                          className={`flex items-center gap-2 ${isHas ? 'bg-white text-black hover:bg-white/90' : 'bg-transparent text-white/50 hover:text-white border-white/10'}`}
                        >
                          <img src={config.icon} alt={config.label} className="w-4 h-4 object-contain" />
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Account Details */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Account Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">User ID</div>
                  <div className="font-mono text-xs">{user.id}</div>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Discord ID</div>
                  <div className="font-mono text-xs">{user.discord_id || "N/A"}</div>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Discord Username</div>
                  <div className="font-medium">{user.discord_username || "N/A"}</div>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Registration Date</div>
                  <div className="text-xs">{format(new Date(user.created_at), 'MMM d, yyyy HH:mm')}</div>
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Session Information
              </h4>
              <div className="space-y-2">
                {user.sessions && user.sessions.length > 0 ? (
                  user.sessions.slice(0, 3).map((session: any, index: number) => (
                    <div key={index} className="bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{session.ip_address}</span>
                          {index === 0 && <Badge variant="outline" className="text-xs">Current</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono">{lastSession?.ip_address || user.last_ip || "No IP recorded"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              {user.discord_id && onInviteToServer && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onInviteToServer(user.id)}
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite to Discord Server
                </Button>
              )}

              <BanUserButton
                userId={user.id}
                username={user.username || user.name}
                currentUserRole={currentUserRole}
                fullWidth={true}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
