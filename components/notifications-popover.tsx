"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Info, MessageSquare, ThumbsUp, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    reference_url?: string;
    read: boolean;
    created_at: string;
}

interface NotificationsPopoverProps {
    currentUserId?: string;
}

export function NotificationsPopover({ currentUserId }: NotificationsPopoverProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const supabase = createClient();

    const fetchNotifications = async () => {
        if (!currentUserId) return;

        const { data } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", currentUserId)
            .order("created_at", { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        }
    };

    useEffect(() => {
        if (!currentUserId) return;

        fetchNotifications();

        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` }, (payload) => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    const markAsRead = async () => {
        if (!currentUserId) return;

        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        await supabase
            .from("notifications")
            .update({ read: true })
            .in("id", unreadIds);

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            markAsRead();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'file_approved': return <FileText className="w-4 h-4 text-green-500" />;
            case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'like_post': return <ThumbsUp className="w-4 h-4 text-pink-500" />;
            case 'system_message': return <Info className="w-4 h-4 text-yellow-500" />;
            default: return <Bell className="w-4 h-4 text-white/70" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white/60 hover:text-white hover:bg-white/5 rounded-full w-9 h-9">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#050505] border border-white/10 rounded-xl shadow-2xl mr-4" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <h4 className="font-semibold text-sm text-white">Notifications</h4>
                    {unreadCount > 0 && (
                        <Badge variant="secondary" className="bg-white/10 text-white/70 text-[10px] h-5">
                            {unreadCount} new
                        </Badge>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="py-8 text-center text-white/40 text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <Link
                                key={notification.id}
                                href={notification.reference_url || '#'}
                                className={cn(
                                    "flex gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors hover:bg-white/5",
                                    !notification.read && "bg-white/[0.02]"
                                )}
                            >
                                <div className="mt-1 bg-white/5 p-2 rounded-full h-fit shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {notification.title && (
                                        <div className="text-sm font-medium text-white mb-0.5">
                                            {notification.title}
                                        </div>
                                    )}
                                    <p className="text-xs text-white/70 leading-relaxed mb-1">
                                        {notification.message}
                                    </p>
                                    <div className="text-[10px] text-white/30">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                                {!notification.read && (
                                    <div className="mt-2 w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                )}
                            </Link>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
