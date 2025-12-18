'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Smile } from 'lucide-react'
import { toggleReaction } from '@/app/actions/post-reactions'
import { cn } from '@/lib/utils'
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import toast from 'react-hot-toast'

interface Reaction {
    id: string
    user_id: string
    emoji: string
    user?: {
        username: string
        avatar_url: string | null
    }
}

interface PostReactionsProps {
    postId: string
    initialReactions: Reaction[]
    currentUserId?: string
    currentUser?: {
        username: string
        avatar_url: string | null
    }
}

export function PostReactions({ postId, initialReactions, currentUserId, currentUser }: PostReactionsProps) {
    const [reactions, setReactions] = useState<Reaction[]>(initialReactions)
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = { count: 0, hasReacted: false, users: [] }
        }
        acc[reaction.emoji].count += 1
        if (reaction.user) {
            acc[reaction.emoji].users.push(reaction.user)
        }
        if (reaction.user_id === currentUserId) {
            acc[reaction.emoji].hasReacted = true
        }
        return acc
    }, {} as Record<string, { count: number; hasReacted: boolean; users: NonNullable<Reaction['user']>[] }>)

    const handleToggle = async (emoji: string) => {
        if (!currentUserId) {
            toast.error("Please login to react")
            return
        }

        const hasReacted = groupedReactions[emoji]?.hasReacted
        const oldReactions = [...reactions]

        if (hasReacted) {
            setReactions(prev => prev.filter(r => !(r.emoji === emoji && r.user_id === currentUserId)))
        } else {
            setReactions(prev => [...prev, {
                id: 'temp-' + Date.now(),
                user_id: currentUserId,
                emoji,
                user: currentUser
            }])
        }

        const res = await toggleReaction(postId, emoji)

        if (res.error) {
            toast.error(res.error)
            setReactions(oldReactions)
        } else {
        }
    }

    useEffect(() => {
        setReactions(initialReactions)
    }, [initialReactions])

    return (
        <div className="flex flex-wrap items-center gap-2">
            {Object.entries(groupedReactions).map(([emoji, { count, hasReacted, users }]) => (
                <div key={emoji} className="relative group">
                    <button
                        onClick={() => handleToggle(emoji)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border",
                            hasReacted
                                ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                                : "bg-[#0A0A0A] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <span>{emoji}</span>
                        <span className={cn("text-xs", hasReacted ? "text-blue-400" : "text-zinc-500")}>{count}</span>
                    </button>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-2 shadow-xl min-w-[160px] max-w-[200px]">
                            <div className="text-[10px] uppercase font-bold text-white/30 mb-2 px-1">Reacted by</div>
                            <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {users.length > 0 ? (
                                    users.map((u, i) => (
                                        <div key={i} className="flex items-center gap-2 p-1 rounded hover:bg-white/5">
                                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-white">
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-white/80 truncate font-medium">{u.username}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-white/50 px-1">Anonymous</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full bg-[#0A0A0A] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 p-0"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="start">
                    <EmojiPicker
                        theme={Theme.DARK}
                        emojiStyle={EmojiStyle.NATIVE}
                        onEmojiClick={(emojiData) => {
                            handleToggle(emojiData.emoji)
                            setIsPickerOpen(false)
                        }}
                        lazyLoadEmojis={true}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
