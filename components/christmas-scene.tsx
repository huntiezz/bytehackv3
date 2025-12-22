"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface ChristmasSceneProps {
    inviteCode: string | null;
}

export function ChristmasScene({ inviteCode }: ChristmasSceneProps) {
    const sceneRef = useRef<HTMLDivElement>(null);
    const [started, setStarted] = useState(false);
    const [snowParticles, setSnowParticles] = useState<{ x: number; y: number; r: number; o: number }[]>([]);

    useEffect(() => {
        setSnowParticles(
            Array.from({ length: 100 }).map(() => ({
                x: Math.random() * 1600,
                y: Math.random() * 900,
                r: Math.random() * 3 + 1,
                o: Math.random() * 0.8,
            }))
        );
    }, []);

    useEffect(() => {
        if (!sceneRef.current) return;

        const svg = sceneRef.current.querySelector(".scene") as HTMLElement;
        if (!svg) return;

        // Select letters - result
        const letters = svg.querySelectorAll("#letters > *");

        function startScene() {
            setStarted(true);

            //Letters intro
            for (let i = 0; i < letters.length; i++) {
                gsap.set(letters[i], {
                    transformOrigin: "center top",
                    rotationZ: Math.random() * 180,
                    scale: 0,
                });
            }
            copyAnim();
        }

        const openBox = () => {
            const gift = document.querySelector(".gift");
            if (gift) gift.removeEventListener("click", openBox);

            gsap.set(".hat", { transformOrigin: "left bottom" });
            gsap.to(".hat", { duration: 1, rotationZ: -80, x: -500, opacity: 0, ease: "power2.in" });
            gsap.to(".box", { duration: 1, y: 800, ease: "power2.in" });

            gsap.to(".gift", {
                duration: 1,
                opacity: 0,
                delay: 1,
                onStart: function () { startScene(); },
                onComplete: function () {
                    const g = document.querySelector(".gift");
                    if (g) g.classList.add("hidden");
                }
            });
        };

        function startAnimations() {
            // Optional loop animations for result can go here
        }

        function copyAnim() {
            // Reveal the letters container first
            gsap.to(svg.querySelector("#letters"), { duration: 0.1, opacity: 1 });
            gsap.to(letters, { duration: 3, scale: 1, rotationZ: 0, ease: "elastic.out(1, 0.3)", stagger: 0.1, onComplete: startAnimations });
        }

        // Setup triggers
        const giftBtn = document.querySelector(".gift");
        if (giftBtn) giftBtn.addEventListener("click", openBox);

        // Show the scene container
        svg.style.display = "block";

        return () => {
            if (giftBtn) giftBtn.removeEventListener("click", openBox);
        }
    }, [inviteCode]);

    return (
        <div ref={sceneRef} className="relative w-full h-full min-h-[500px] select-none">
            {/* The SVG Scene Container */}
            <svg
                className="scene hidden w-full h-full max-h-[80vh]"
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <style>{`
                      .cls-1{fill:#fff;} 
                      .cls-2{fill:#e6e6e6;}
                      #letters text { font-family: 'Courier New', monospace; font-weight: bold; font-size: 60px; text-anchor: middle; }
                   `}</style>
                </defs>

                {/* Sky/Background - Night */}
                <rect width="1600" height="900" fill="#000000" />

                {/* Stars / Distant Snow */}
                <g id="snow">
                    {snowParticles.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="white" opacity={p.o} />
                    ))}
                </g>

                {/* Ski Lift - Removed */}

                {/* Mountains/Ground Hills - Removed */}

                {/* Houses - Removed */}

                {/* Penguins - Removed */}

                {/* Characters - Removed */}

                {/* Hanging Letters - Removed */}

                {/* Result Area: Code or Coal */}
                <g id="letters" transform="translate(800, 300)" textAnchor="middle" opacity="0">
                    {inviteCode ? (
                        <g>
                            <text x="0" y="0" fill="#15803d" className="drop-shadow-md">INVITE CODE:</text>
                            <text x="0" y="80" fill="#16a34a" fontSize="100" fontWeight="bold" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }}>{inviteCode}</text>
                        </g>
                    ) : (
                        <g>
                            <text x="0" y="-50" fill="#b91c1c" fontSize="40">sorry, no invite code for you :/</text>
                            <g id="coal" transform="translate(0, 50)">
                                {/* Coal Lumps */}
                                <path d="M-40,0 L-20,-20 L20,0 L10,30 L-30,20 Z" fill="#1a202c" />
                                <path d="M10,10 L30,-10 L60,10 L50,40 L10,30 Z" fill="#2d3748" />
                                <path d="M-20,20 L0,5 L30,20 L10,50 L-10,40 Z" fill="black" />
                            </g>
                        </g>
                    )}
                </g>

                {/* Interaction Overlays - Removed */}
            </svg>

            {/* Gift Box Overlay (Unchanged) */}
            <div className="gift absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50 transition-transform hover:scale-105 active:scale-95">
                <div className="hat w-32 h-10 bg-red-600 relative top-0 z-10 shadow-lg border-b-4 border-red-800 rounded-sm">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 rounded-full shadow-sm"></div>
                </div>
                <div className="box w-32 h-32 bg-red-500 shadow-xl relative flex items-center justify-center border-t-0 rounded-b-sm">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-yellow-400"></div>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-yellow-400"></div>
                </div>
                <div className="text-white text-center mt-4 font-bold text-xl drop-shadow-md animate-bounce">Click to Open</div>
            </div>
        </div>
    );
}
