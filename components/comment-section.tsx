"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Reply as ReplyIcon, UserIcon, MessageSquare, Lock } from "lucide-react";
import Link from "next/link";
import { StyledUsername } from "@/components/styled-username";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Comment length limits (must match backend)
const COMMENT_MAX_LENGTH = 2000;

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  parent_id?: string | null;
  author: {
    username: string;
    display_name?: string;
    avatar_url?: string;
    profile_picture?: string;
    is_admin?: boolean;
    effect_label?: string;
    badges?: string[];
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  comments: any[];
  currentUserId: string;
  isLocked?: boolean;
}

export function CommentSection({ postId, postAuthorId, comments, currentUserId, isLocked = false }: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const router = useRouter();

  // Handle content change with length enforcement
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    // Enforce max length on frontend (prevents typing beyond limit)
    if (newContent.length <= COMMENT_MAX_LENGTH) {
      setContent(newContent);
    } else {
      toast.error(`Comment cannot exceed ${COMMENT_MAX_LENGTH} characters!`);
    }
  };

  // Handle reply content change with length enforcement
  const handleReplyContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= COMMENT_MAX_LENGTH) {
      setReplyContent(newContent);
    } else {
      toast.error(`Reply cannot exceed ${COMMENT_MAX_LENGTH} characters!`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !content.trim()) return;

    // Double-check length before sending
    if (content.trim().length > COMMENT_MAX_LENGTH) {
      toast.error(`Comment cannot exceed ${COMMENT_MAX_LENGTH} characters!`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });

      if (res.ok) {
        setContent("");
        toast.success("Comment posted");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post comment");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (isLocked || !replyContent.trim()) return;

    // Double-check length before sending
    if (replyContent.trim().length > COMMENT_MAX_LENGTH) {
      toast.error(`Reply cannot exceed ${COMMENT_MAX_LENGTH} characters!`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: replyContent,
          parentCommentId: parentId
        }),
      });

      if (res.ok) {
        setReplyContent("");
        setReplyingTo(null);
        toast.success("Reply posted");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post reply");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Comment deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  const mappedComments: Comment[] = comments.map((c: any) => ({
    id: c.id,
    body: c.body || c.content,
    created_at: c.created_at,
    author_id: c.author_id,
    parent_id: c.parent_id || c.parent_comment_id,
    author: c.author,
  }));

  const parentComments = mappedComments.filter(c => !c.parent_id);
  const commentReplies = mappedComments.reduce((acc, comment) => {
    if (comment.parent_id) {
      if (!acc[comment.parent_id]) {
        acc[comment.parent_id] = [];
      }
      acc[comment.parent_id].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  const renderComment = (comment: Comment, isReply = false) => {
    const isOP = comment.author_id === postAuthorId;
    const isOwnComment = comment.author_id === currentUserId;
    const replies = commentReplies[comment.id] || [];

    const displayAvatar = comment.author.profile_picture || comment.author.avatar_url;
    const displayName = comment.author.display_name || comment.author.username;

    return (
      <div key={comment.id} className={isReply ? "ml-12 mt-3" : ""}>
        <div className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-start gap-3">
            {comment.author.username ? (
              <Link href={`/user/${comment.author.username}`} className="flex-shrink-0">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full hover:ring-2 ring-primary transition-all object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:ring-2 ring-primary transition-all">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </Link>
            ) : (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {comment.author.username ? (
                  <Link href={`/user/${comment.author.username}`} className="hover:underline min-w-0 max-w-[200px]">
                    <div className="truncate">
                      <StyledUsername
                        name={displayName}
                        nameColor={undefined}
                        fontStyle={undefined}
                        nameEffect={comment.author.effect_label}
                        level={0}
                        role={comment.author.is_admin ? "admin" : "user"}
                        isOP={isOP}
                        className="truncate"
                      />
                    </div>
                  </Link>
                ) : (
                  <span className="text-zinc-500">Unknown</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="prose prose-invert max-w-none mb-2 font-proggy text-base leading-relaxed break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({ node, ...props }: any) => (
                      <div className="relative">
                        <pre {...props} className="bg-[#111] border border-white/10 p-2 rounded-lg overflow-x-auto text-xs" />
                      </div>
                    ),
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !className?.includes('language-') ? (
                        <code {...props} className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-[#FFD700]">
                          {children}
                        </code>
                      ) : (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      )
                    },
                    a: ({ node, ...props }: any) => (
                      <a {...props} className="text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer" />
                    ),
                    img: ({ node, ...props }: any) => (
                      <img {...props} className="rounded-lg border border-white/10 max-h-[300px] object-contain" />
                    ),
                    blockquote: ({ node, ...props }: any) => (
                      <blockquote {...props} className="border-l-2 border-primary/50 pl-3 italic text-white/60 bg-white/5 py-1 pr-3 rounded-r-lg" />
                    ),
                    table: ({ node, ...props }: any) => (
                      <div className="overflow-x-auto my-2 border border-white/10 rounded-lg">
                        <table {...props} className="w-full text-left border-collapse text-xs" />
                      </div>
                    ),
                    th: ({ node, ...props }: any) => (
                      <th {...props} className="border-b border-white/10 bg-white/5 p-2 font-bold text-white" />
                    ),
                    h1: ({ node, ...props }: any) => (
                      <h1 {...props} className="text-xl font-bold text-white mt-3 mb-2 border-b border-white/10 pb-1" />
                    ),
                    h2: ({ node, ...props }: any) => (
                      <h2 {...props} className="text-lg font-bold text-white mt-2 mb-1" />
                    ),
                    h3: ({ node, ...props }: any) => (
                      <h3 {...props} className="text-base font-bold text-white mt-2 mb-1" />
                    ),
                    td: ({ node, ...props }: any) => (
                      <td {...props} className="border-b border-white/5 p-2 text-white/80" />
                    )
                  }}
                >
                  {comment.body}
                </ReactMarkdown>
              </div>
              <div className="flex items-center gap-2">
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
                {isOwnComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder={`Reply to ${comment.author.username.length > 15 ? comment.author.username.substring(0, 15) + "..." : comment.author.username}...`}
                    value={replyContent}
                    onChange={handleReplyContentChange}
                    rows={2}
                    disabled={loading}
                    className="text-sm"
                    maxLength={COMMENT_MAX_LENGTH}
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className={`${
                      replyContent.length > COMMENT_MAX_LENGTH * 0.9 
                        ? 'text-red-500 font-semibold' 
                        : replyContent.length > COMMENT_MAX_LENGTH * 0.75 
                          ? 'text-yellow-500' 
                          : 'text-muted-foreground'
                    }`}>
                      {replyContent.length} / {COMMENT_MAX_LENGTH}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={loading || !replyContent.trim() || replyContent.length > COMMENT_MAX_LENGTH}
                    >
                      {loading ? "Posting..." : "Post Reply"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Render replies */}
        {replies.length > 0 && (
          <div className="space-y-3 mt-3">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      {isLocked ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-500 mb-6">
          <Lock className="w-5 h-5" />
          <span className="font-semibold text-sm">This thread is locked. You cannot post new comments.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={content}
              onChange={handleContentChange}
              rows={3}
              disabled={loading}
              maxLength={COMMENT_MAX_LENGTH}
            />
            <div className="flex justify-between items-center text-sm">
              <span className={`${
                content.length > COMMENT_MAX_LENGTH * 0.9 
                  ? 'text-red-500 font-semibold' 
                  : content.length > COMMENT_MAX_LENGTH * 0.75 
                    ? 'text-yellow-500' 
                    : 'text-muted-foreground'
              }`}>
                {content.length} / {COMMENT_MAX_LENGTH} characters
              </span>
              {content.length > COMMENT_MAX_LENGTH * 0.9 && (
                <span className="text-red-500 text-xs">
                  {COMMENT_MAX_LENGTH - content.length} remaining
                </span>
              )}
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading || !content.trim() || content.length > COMMENT_MAX_LENGTH}
          >
            {loading ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4 mt-6">
        {parentComments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {parentComments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}
