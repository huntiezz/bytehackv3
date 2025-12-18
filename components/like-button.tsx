"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggleLike = async () => {
    setLoading(true);
    const newLiked = !liked;

    try {
      const res = await fetch("/api/likes", {
        method: newLiked ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        setLiked(newLiked);
        setCount(count + (newLiked ? 1 : -1));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update like");
      }
    } catch (error) {
      alert("Failed to update like");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={liked ? "default" : "ghost"} 
      size="sm"
      onClick={handleToggleLike}
      disabled={loading}
    >
      <ThumbsUp className={`h-4 w-4 mr-2 ${liked ? "fill-current" : ""}`} />
      {count}
    </Button>
  );
}
