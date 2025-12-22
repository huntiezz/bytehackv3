"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ChristmasLights() {
    const [mounted, setMounted] = useState(false);
    const [lightCount, setLightCount] = useState(0);

    useEffect(() => {
        setMounted(true);
        const calculateLights = () => {
            if (typeof window === 'undefined') return;
            const width = window.innerWidth;
            // Place a light every ~60px for better spacing
            const count = Math.ceil(width / 60);
            setLightCount(count);
        };

        calculateLights();
        window.addEventListener('resize', calculateLights);
        return () => window.removeEventListener('resize', calculateLights);
    }, []);

    if (!mounted) return null;

    const lights = Array.from({ length: lightCount });
    const colors = [
        { bg: "bg-[#ff3b3b]", shadow: "rgba(255, 59, 59, 0.6)" },   // Red
        { bg: "bg-[#2eff46]", shadow: "rgba(46, 255, 70, 0.6)" },   // Green
        { bg: "bg-[#ffcc00]", shadow: "rgba(255, 204, 0, 0.6)" },  // Gold
        { bg: "bg-[#3399ff]", shadow: "rgba(51, 153, 255, 0.6)" },  // Blue
        { bg: "bg-[#ff33ff]", shadow: "rgba(255, 51, 255, 0.6)" },  // Magenta
    ];

    return (
        <div className="absolute top-0 left-0 w-full h-20 pointer-events-none z-20 overflow-hidden flex justify-between px-4 select-none">
            {/* The wire - lowered slightly and curved illusion via thick border or just straight for now */}
            <div className="absolute top-[-10px] left-0 w-full h-4 border-b-2 border-zinc-800/80 rounded-[100%]" />

            {lights.map((_, i) => {
                const color = colors[i % colors.length];
                const rotation = (i * 1337) % 20 - 10; // Deterministic pseudo-random rotation
                const delay = (i * 0.2) % 2;

                return (
                    <div
                        key={i}
                        className="relative flex flex-col items-center origin-top transform-gpu"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            marginTop: -2
                        }}
                    >
                        {/* Socket */}
                        <div className="w-3 h-4 bg-[#1a1a1a] rounded-sm mb-[-2px] z-10 border border-white/5 shadow-sm" />

                        {/* Bulb */}
                        <div
                            className={cn(
                                "w-4 h-6 rounded-full relative transition-all duration-1000 animate-pulse",
                                color.bg
                            )}
                            style={{
                                animationDuration: `${2 + (i % 3)}s`,
                                animationDelay: `${delay}s`,
                                boxShadow: `0 0 16px 2px ${color.shadow}`
                            }}
                        >
                            {/* Glass Reflection */}
                            <div className="absolute top-1 right-1 w-1.5 h-2 bg-white/40 rounded-full blur-[0.5px] rotate-12" />

                            {/* Filament/Core Glow */}
                            <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 bg-white/80 rounded-full blur-[1px] opacity-50" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
