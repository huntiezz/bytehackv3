"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { postProfileComment, getProfileComments } from "@/app/actions/profile-comments";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

// Profile comment length limit (must match backend)
const PROFILE_COMMENT_MAX_LENGTH = 500;

interface ProfileCommentsProps {
    targetUserId: string;
}

export function ProfileComments({ targetUserId }: ProfileCommentsProps) {
    const [open, setOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadComments();
        }
    }, [open]);

    async function loadComments() {
        const data = await getProfileComments(targetUserId);
        setComments(data);
    }

    // Handle comment input with length enforcement
    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= PROFILE_COMMENT_MAX_LENGTH) {
            setNewComment(newValue);
        } else {
            toast.error(`Comment cannot exceed ${PROFILE_COMMENT_MAX_LENGTH} characters!`);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newComment.trim()) return;

        // Double-check length before sending
        if (newComment.trim().length > PROFILE_COMMENT_MAX_LENGTH) {
            toast.error(`Comment cannot exceed ${PROFILE_COMMENT_MAX_LENGTH} characters!`);
            return;
        }

        setLoading(true);
        const result = await postProfileComment(targetUserId, newComment);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Comment posted!");
            setNewComment("");
            loadComments();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-md text-foreground border border-white/10">
                    <MessageSquare className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-black/90 border-white/10 backdrop-blur-xl text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Comments
                        <span className="text-xs text-muted-foreground ml-auto font-normal">
                            {comments.length} comments
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col h-[400px]">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2 py-2 custom-scrollbar">
                        {comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                                <MessageSquare className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No comments yet. Be the first!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={comment.author.discord_avatar ? `https://cdn.discordapp.com/avatars/${comment.author.discord_id}/${comment.author.discord_avatar}.png` : comment.author.profile_picture} />
                                        <AvatarFallback>{comment.author.name?.[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white/90 truncate">{comment.author.name || comment.author.username}</span>
                                            <span className="text-[10px] text-white/40">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-sm text-white/70 break-words mt-0.5 leading-relaxed">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4 flex gap-2 pt-4 border-t border-white/10">
                        <div className="flex-1 space-y-1">
                            <Input
                                value={newComment}
                                onChange={handleCommentChange}
                                placeholder="Write a comment..."
                                className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-white/30"
                                maxLength={PROFILE_COMMENT_MAX_LENGTH}
                            />
                            <div className="text-[10px] text-right">
                                <span className={`${
                                    newComment.length > PROFILE_COMMENT_MAX_LENGTH * 0.9 
                                        ? 'text-red-500 font-semibold' 
                                        : newComment.length > PROFILE_COMMENT_MAX_LENGTH * 0.75 
                                            ? 'text-yellow-500' 
                                            : 'text-white/40'
                                }`}>
                                    {newComment.length} / {PROFILE_COMMENT_MAX_LENGTH}
                                </span>
                            </div>
                        </div>
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={loading || !newComment.trim() || newComment.length > PROFILE_COMMENT_MAX_LENGTH} 
                            className="shrink-0 self-start"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
