"use client";

import { Card } from "@/components/ui/card";
import { useMemo } from "react";
import { motion } from "framer-motion";

interface AdminAnalyticsProps {
    users: any[];
    posts: any[];
}

export function AdminAnalytics({ users, posts }: AdminAnalyticsProps) {
    const userGrowth = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const count = users.filter(u => u.created_at.startsWith(date)).length;
            return { date, count };
        });
    }, [users]);

    const postActivity = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const count = posts.filter(p => p.created_at.startsWith(date)).length;
            return { date, count };
        });
    }, [posts]);

    const maxUserCount = Math.max(...userGrowth.map(d => d.count), 1);
    const maxPostCount = Math.max(...postActivity.map(d => d.count), 1);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">User Growth (Last 7 Days)</h3>
                <div className="h-[200px] flex items-end justify-between gap-2">
                    {userGrowth.map((item, index) => (
                        <div key={item.date} className="flex flex-col items-center gap-2 flex-1 group">
                            <div className="relative w-full flex justify-center items-end h-[160px]">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(item.count / maxUserCount) * 100}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="w-full max-w-[30px] bg-primary/20 border border-primary/50 rounded-t-sm relative group-hover:bg-primary/40 transition-colors min-h-[4px]"
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.count}
                                    </div>
                                </motion.div>
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate w-full text-center">
                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Post Activity Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">New Posts (Last 7 Days)</h3>
                <div className="h-[200px] flex items-end justify-between gap-2">
                    {postActivity.map((item, index) => (
                        <div key={item.date} className="flex flex-col items-center gap-2 flex-1 group">
                            <div className="relative w-full flex justify-center items-end h-[160px]">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(item.count / maxPostCount) * 100}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="w-full max-w-[30px] bg-blue-500/20 border border-blue-500/50 rounded-t-sm relative group-hover:bg-blue-500/40 transition-colors min-h-[4px]"
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.count}
                                    </div>
                                </motion.div>
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate w-full text-center">
                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
