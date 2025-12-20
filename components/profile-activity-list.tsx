"use client";

import Link from "next/link";
import { MessageSquare, MessageCircle, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PaginatedList } from "@/components/paginated-list";

interface ActivityItem {
  type: 'post' | 'comment';
  id: string;
  content: string;
  date: Date;
  category: string;
  referenceId?: string;
  title?: string;
}

interface Post {
  id: string;
  title: string;
  category: string;
  created_at: string;
  thread_replies?: Array<{ count: number }>;
}

interface ProfileActivityListProps {
  activities: ActivityItem[];
  posts: Post[];
}

export function ProfileActivityList({ activities, posts }: ProfileActivityListProps) {
  return (
    <>
      {/* Activity Tab Content */}
      {activities.length > 0 ? (
        <PaginatedList
          items={activities}
          itemsPerPage={5}
          renderItem={(item) => (
            <Link href={item.type === 'post' ? `/forum/${item.id}` : `/forum/${item.referenceId}`}>
              <div className="group relative flex items-start gap-5 p-6 rounded-[20px] bg-[#090909] border border-zinc-900 hover:border-zinc-800 hover:bg-[#0c0c0c] transition-all duration-300">
                {/* Left Icon */}
                <div className="mt-1 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-900/50 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                    <MessageSquare className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate pr-4">
                        {item.content}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-bold text-zinc-600 tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(item.date, 'dd/MM/yyyy, HH:mm')}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-800 px-1.5 py-0.5 rounded px-2 group-hover:text-zinc-400 group-hover:border-zinc-700 transition-all">
                          View Thread
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        {item.category}
                      </div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                        {item.type === 'post' ? 'Thread' : 'Reply'}
                      </div>
                    </div>
                  </div>

                  {/* Optional Subtext for comments */}
                  {item.type === 'comment' && item.title && (
                    <div className="mt-2 text-[11px] text-zinc-500 font-medium truncate border-t border-white/5 pt-2">
                      In: <span className="text-zinc-400">{item.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )}
        />
      ) : (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900/30 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-zinc-700" />
          </div>
          <div className="text-zinc-600 text-[11px] uppercase tracking-widest font-bold">No recent activity to display</div>
        </div>
      )}
    </>
  );
}

export function ProfilePostsList({ posts }: { posts: Post[] }) {
  return (
    <>
      {posts && posts.length > 0 ? (
        <PaginatedList
          items={posts}
          itemsPerPage={5}
          renderItem={(post: Post) => (
            <Link href={`/forum/${post.id}`}>
              <div className="group relative flex items-center gap-5 p-6 rounded-[20px] bg-[#090909] border border-zinc-900 hover:border-zinc-800 hover:bg-[#0c0c0c] transition-all duration-300">
                <div className="mt-0.5 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-900/50 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                    <MessageCircle className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                        {post.title}
                      </h3>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-1">
                        {post.category}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
                        {post.thread_replies?.[0]?.count || 0} REPLIES
                      </div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}
        />
      ) : (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900/30 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-zinc-700" />
          </div>
          <div className="text-zinc-600 text-[11px] uppercase tracking-widest font-bold">No postings found</div>
        </div>
      )}
    </>
  );
}

