"use client";

import { useEffect } from "react";

export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch(`/api/posts/${postId}/view`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };

    trackView();
  }, [postId]);

  return null;
}
