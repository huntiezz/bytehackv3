"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PresenceUpdater() {
    const pathname = usePathname();

    useEffect(() => {

        const sendHeartbeat = async () => {
            try {
                await fetch("/api/user/heartbeat", { method: "POST" });
            } catch (err) {
            }
        };

        sendHeartbeat();

        const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, [pathname]);

    return null;
}
