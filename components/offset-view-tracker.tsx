"use client";

import { useEffect } from "react";

interface OffsetViewTrackerProps {
  offsetId: string;
}

export function OffsetViewTracker({ offsetId }: OffsetViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch(`/api/offsets/${offsetId}/view`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    trackView();
  }, [offsetId]);

  return null;
}
