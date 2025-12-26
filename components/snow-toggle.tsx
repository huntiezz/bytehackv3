"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudSnow, Slash } from "lucide-react";
import { cn } from "@/lib/utils";

export function SnowToggle() {
    const [enabled, setEnabled] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("snow-enabled");
        setEnabled(stored !== "false");
    }, []);

    const toggleSnow = () => {
        const newState = !enabled;
        setEnabled(newState);
        localStorage.setItem("snow-enabled", String(newState));
        window.dispatchEvent(new Event("snow-toggle"));
    };

    if (!mounted) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSnow}
            className={cn(
                "rounded-full w-9 h-9 transition-all",
                enabled ? "text-white/60 hover:text-white" : "text-white/30 hover:text-white/60"
            )}
            title={enabled ? "Disable Snow" : "Enable Snow"}
        >
            <div className="relative">
                <CloudSnow className="w-4 h-4" />
                {!enabled && (
                    <Slash className="w-4 h-4 absolute inset-0 text-zinc-500 transform scale-125" />
                )}
            </div>
        </Button>
    );
}
