"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Award, Mail, Calendar, Hash, Activity } from "lucide-react";
import { BADGES_CONFIG } from "@/lib/badges";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { BanUserButton } from "./ban-user-button";

interface AdminUserEditSheetProps {
    user: any | null;
    isOpen: boolean;
    onClose: () => void;
    isCurrentUserAdmin: boolean;
}

export function AdminUserEditSheet({ user, isOpen, onClose, isCurrentUserAdmin }: AdminUserEditSheetProps) {
    const [role, setRole] = useState(user?.role || "user");
    const [isAdmin, setIsAdmin] = useState(user?.is_admin || false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            setRole(user.role || "user");
            setIsAdmin(user.is_admin || false);
        }
    }, [user]);

    if (!user) return null;

    const handleRoleUpdate = async (newRole: string) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/update-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, role: newRole }),
            });

            if (!res.ok) throw new Error("Failed to update role");

            setRole(newRole);
            toast.success(`Role updated to ${newRole}`);
            router.refresh();
        } catch (error) {
            toast.error("Failed to update role");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminToggle = async () => {
        setIsLoading(true);
        try {
            const newIsAdmin = !isAdmin;
            const res = await fetch("/api/admin/update-admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, isAdmin: newIsAdmin }),
            });

            if (!res.ok) throw new Error("Failed to update admin status");

            setIsAdmin(newIsAdmin);
            toast.success(newIsAdmin ? "User promoted to admin" : "Admin status removed");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update admin status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBadgeToggle = async (badgeId: string) => {
        const currentBadges = user.badges || [];
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

            if (!res.ok) throw new Error("Failed to update badges");

            toast.success("Badges updated");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update badges");
        }
    };

    const displayName = user.display_name || user.username || 'Unknown';
    const avatarUrl = user.avatar_url;
    const userRole = user.is_admin ? 'Admin' : (user.role || 'User');

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] bg-[#09090b] border-l border-white/10 text-white overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-xl font-bold border border-white/10">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                displayName[0]?.toUpperCase()
                            )}
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold text-white">{displayName}</SheetTitle>
                            <SheetDescription className="text-white/40">@{user.username || 'unknown'}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Role Management */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-semibold text-white/80">
                            <Shield className="w-4 h-4" /> Role Management
                        </h4>

                        {/* Admin Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                            <div>
                                <div className="font-medium text-white">Administrator</div>
                                <div className="text-xs text-white/40">Full access to admin panel</div>
                            </div>
                            <Button
                                size="sm"
                                variant={isAdmin ? "default" : "outline"}
                                className={isAdmin ? "bg-red-500 hover:bg-red-600" : ""}
                                onClick={handleAdminToggle}
                                disabled={isLoading || !isCurrentUserAdmin}
                            >
                                {isAdmin ? "Remove" : "Grant"}
                            </Button>
                        </div>

                        {/* Role Selector */}
                        <Select value={role} onValueChange={handleRoleUpdate} disabled={isLoading || !isCurrentUserAdmin}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="offset_updater">Offset Updater</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Badge Management */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-semibold text-white/80">
                            <Award className="w-4 h-4" /> Badges
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(BADGES_CONFIG).map(([key, config]) => {
                                const hasBadge = user.badges?.includes(key);
                                return (
                                    <Button
                                        key={key}
                                        variant="outline"
                                        size="sm"
                                        className={`justify-start gap-3 h-10 ${hasBadge ? 'bg-white/10 border-green-500/50 text-white' : 'bg-transparent border-white/5 text-white/40 hover:text-white'}`}
                                        onClick={() => handleBadgeToggle(key)}
                                        disabled={!isCurrentUserAdmin}
                                    >
                                        <div className="w-5 h-5 relative">
                                            <img src={config.icon} alt={config.label} className="w-full h-full object-contain" />
                                        </div>
                                        <span>{config.label}</span>
                                        {hasBadge && <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-semibold text-white/80">
                            <Activity className="w-4 h-4" /> Account Details
                        </h4>

                        <div className="space-y-3">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <span className="text-xs text-white/40 block mb-1">User ID</span>
                                <div className="font-mono text-sm flex items-center gap-2">
                                    {user.id}
                                </div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <span className="text-xs text-white/40 block mb-1">Email</span>
                                <div className="text-sm flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-white/40" />
                                    {user.email}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/10">
                        <BanUserButton
                            userId={user.id}
                            username={displayName}
                            currentUserRole={isCurrentUserAdmin ? 'admin' : 'user'}
                            fullWidth
                        />
                    </div>
                </div>

            </SheetContent>
        </Sheet>
    );
}
