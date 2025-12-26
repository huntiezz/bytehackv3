"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PasswordRecoveryListener() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

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
