"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
    targetUserId: string;
    initialIsFollowing: boolean;
    onToggle?: (newIsFollowing: boolean) => void;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function FollowButton({
    targetUserId,
    initialIsFollowing,
    onToggle,
    className,
    size = "default",
    variant = "secondary"
}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleToggleFollow = async () => {
        setLoading(true);

        // Optimistic update
        const previousState = isFollowing;
        setIsFollowing(!isFollowing);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to follow");
                setIsFollowing(previousState);
                setLoading(false);
                return;
            }

            if (previousState) {
                // Unfollow
                const { error } = await supabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("following_id", targetUserId);

                if (error) throw error;
                toast.success("Unfollowed");
            } else {
                // Follow
                const { error } = await supabase
                    .from("follows")
                    .insert({
                        follower_id: user.id,
                        following_id: targetUserId
                    });

                if (error) throw error;
                toast.success("Followed!");
            }

            if (onToggle) onToggle(!previousState);
            router.refresh();
        } catch (error: any) {
            setIsFollowing(previousState); // Revert
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleToggleFollow}
            disabled={loading}
            size={size}
            variant={isFollowing ? "outline" : variant}
            className={className}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                </>
            )}
        </Button>
    );
}
