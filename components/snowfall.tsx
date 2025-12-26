"use client";

import { useEffect, useRef, useState } from "react";

export function Snowfall() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        const checkEnabled = () => {
            const stored = localStorage.getItem("snow-enabled");
            // Default is enabled if not present or "true"
            setEnabled(stored !== "false");
        };

        checkEnabled();

        const handleToggle = () => checkEnabled();
        window.addEventListener("snow-toggle", handleToggle);

        return () => window.removeEventListener("snow-toggle", handleToggle);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const setSize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        setSize();

        const snowflakes: { x: number; y: number; radius: number; speed: number; wind: number; opacity: number }[] = [];
        // Responsive count
        const count = Math.min(150, Math.floor(width / 8));

        for (let i = 0; i < count; i++) {
            snowflakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 0.5,
                speed: Math.random() * 1.5 + 0.5,
                wind: Math.random() * 0.5 - 0.25,
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        let animationId: number;

        function draw() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            for (const flake of snowflakes) {
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
                ctx.moveTo(flake.x, flake.y);
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            update();
            animationId = requestAnimationFrame(draw);
        }

        function update() {
            for (const flake of snowflakes) {
                flake.y += flake.speed;
                flake.x += flake.wind;

                if (flake.y > height) {
                    flake.y = -5;
                    flake.x = Math.random() * width;
                }

                // Wrap around X
                if (flake.x > width) flake.x = 0;
                else if (flake.x < 0) flake.x = width;
            }
        }

        window.addEventListener("resize", setSize);
        draw();

        return () => {
            window.removeEventListener("resize", setSize);
            cancelAnimationFrame(animationId);
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ pointerEvents: "none" }}
        />
    );
}
