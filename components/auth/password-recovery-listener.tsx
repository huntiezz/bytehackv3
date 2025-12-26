"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PasswordRecoveryListener() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        // 1. Check for Hash Fragment (Implicit Flow) which happens sometimes with recoveries
        const hash = window.location.hash;
        if (hash && hash.includes("type=recovery") && hash.includes("access_token")) {
            // We are essentially authenticated now via the hash, but need to let the session establish
            // Then redirect.
            router.push("/update-password");
        }

        // 2. Standard Event Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                router.push("/update-password");
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return null;
}
