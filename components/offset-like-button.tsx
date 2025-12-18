"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

interface OffsetLikeButtonProps {
  offsetId: string;
  initialLikes: number;
  initialLiked?: boolean;
}

export function OffsetLikeButton({ 
  offsetId, 
  initialLikes,
  initialLiked = false 
}: OffsetLikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/offsets/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offsetId }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsLiked(data.liked);
        setLikes(data.likes);
        if (data.liked) {
          toast.success("Added to favorites!");
        } else {
          toast.success("Removed from favorites");
        }
      } else {
        toast.error(data.error || "Failed to like offset");
      }
    } catch (error) {
      console.error("Error liking offset:", error);
      toast.error("Failed to update like");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className="w-full justify-start gap-2 text-xs"
    >
      <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
      <span>{isLiked ? "Liked" : "Like"}</span>
      <span className="ml-auto text-muted-foreground text-xs">({likes})</span>
    </Button>
  );
}
