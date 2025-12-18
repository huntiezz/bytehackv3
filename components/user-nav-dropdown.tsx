"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, Shield, LogOut, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UserNavDropdownProps {
    user: any;
    isAdmin?: boolean;
    isOffsetUpdater?: boolean;
}

export function UserNavDropdown({ user, isAdmin, isOffsetUpdater }: UserNavDropdownProps) {
    const displayName = user.display_name || user.username || user.name || "User";
    const username = user.username || "user";
    const email = user.email || `${username}@bytehack.com`;
    const avatarUrl = user.avatar_url || user.user_metadata?.avatar_url;
    const initial = displayName[0]?.toUpperCase() || "U";
    const postCount = user.post_count ?? 0;
    const reactionScore = user.reaction_score ?? 0;
    const userIsAdmin = user.is_admin || isAdmin || user.role === 'admin';

    return (
        <div className="flex items-center gap-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-white/10 hover:border-white/20 p-0 overflow-hidden transition-colors">
                        <Avatar className="h-full w-full">
                            <AvatarImage src={avatarUrl} alt={displayName} />
                            <AvatarFallback className="bg-[#111] text-white/60 text-xs">{initial}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-0 bg-black border border-white/10 rounded-[20px] overflow-hidden shadow-2xl mr-4 mt-2" align="end" forceMount>
                    <div className="flex flex-col items-center justify-center p-4 bg-[#030303]">
                        <div className="relative h-14 w-14 mb-2 rounded-full overflow-hidden border-2 border-white/5 shadow-inner">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={avatarUrl} alt={displayName} />
                                <AvatarFallback className="bg-[#111] text-lg text-white/40">{initial}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col items-center space-y-0.5 text-center">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-[#FFD700] tracking-wide truncate max-w-[180px]">
                                    {displayName.length > 15 ? displayName.substring(0, 15) + "..." : displayName}
                                </p>
                                {userIsAdmin && (
                                    <div title="Administrator">
                                        <Shield className="w-3.5 h-3.5 text-[#FF5555]" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-medium text-white/40 truncate max-w-[200px]">
                                {email}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-white/30 tracking-widest uppercase">
                            <span>Posts {postCount}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <span>Score {reactionScore}</span>
                        </div>
                    </div>

                    <DropdownMenuSeparator className="bg-white/5 m-0" />

                    <div className="p-1.5 space-y-0.5 bg-[#050505]">
                        <DropdownMenuItem asChild>
                            <Link href={`/profile/${username}`} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 focus:bg-white/5 text-xs font-medium text-white/80 focus:text-white transition-colors">
                                <User className="w-3.5 h-3.5 text-white/40" />
                                Profile
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link href="/account" className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 focus:bg-white/5 text-xs font-medium text-white/80 focus:text-white transition-colors">
                                <Settings className="w-3.5 h-3.5 text-white/40" />
                                Settings
                            </Link>
                        </DropdownMenuItem>


                        {(userIsAdmin || isOffsetUpdater) && (
                            <>
                                <DropdownMenuItem asChild>
                                    <Link href="/offset-updater" className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 focus:bg-white/5 text-xs font-medium text-white/80 focus:text-white transition-colors">
                                        <Download className="w-3.5 h-3.5 text-white/40" />
                                        Offset Updater
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 focus:bg-white/5 text-xs font-medium text-[#FF5555] focus:text-[#FF5555]/90 transition-colors">
                                        <Shield className="w-3.5 h-3.5 opacity-80" />
                                        Admin Panel
                                    </Link>
                                </DropdownMenuItem>
                            </>
                        )}
                    </div>

                    <DropdownMenuSeparator className="bg-white/5 m-0" />

                    <div className="p-1.5 bg-[#050505]">
                        <form action="/api/auth/signout" method="post" className="w-full">
                            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-red-500/10 focus:bg-red-500/10 text-xs font-medium text-[#FF5555] active:bg-red-500/20 transition-colors text-left">
                                <LogOut className="w-3.5 h-3.5 opacity-80" />
                                Logout
                            </button>
                        </form>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
