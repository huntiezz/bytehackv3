"use client";

import { useEffect, useRef } from "react";

export function ProfileViewTracker({ profileId }: { profileId: string }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const recordView = async () => {
      const key = `viewed_profile_${profileId}`;
      if (localStorage.getItem(key)) return;

      try {
        const res = await fetch('/api/user/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId })
        });

        if (res.ok) {
          localStorage.setItem(key, "true");
        }
      } catch (e) {
        console.error("Failed to record view", e);
      }
    };

    recordView();
  }, [profileId]);

  return null;
}
