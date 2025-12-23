
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChristmasSceneProps {
    inviteCode: string | null;
    initialRevealed?: boolean;
}

export function ChristmasScene({ inviteCode, initialRevealed = false }: ChristmasSceneProps) {
    const sceneRef = useRef<HTMLDivElement>(null);
    const [started, setStarted] = useState(initialRevealed);
    const [snowParticles, setSnowParticles] = useState<{ x: number; y: number; r: number; o: number }[]>([]);

    const [internalInviteCode, setInternalInviteCode] = useState<string | null>(inviteCode);

    const [showCopyBtn, setShowCopyBtn] = useState(initialRevealed && !!inviteCode);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

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

    const getFingerprint = () => {
        if (typeof window === 'undefined') return 'server';
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return 'no-canvas-' + Math.random();

            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("ChristmasEvent2024", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("ChristmasEvent2024", 4, 17);

            const b64 = canvas.toDataURL();
            let hash = 0;
            for (let i = 0; i < b64.length; i++) {
                const char = b64.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString() + "-" + (navigator.userAgent || '').replace(/\D+/g, '').slice(0, 10);
        } catch (e) {
            return "error-" + Math.random();
        }
    };

    useEffect(() => {
        if (!sceneRef.current) return;

        const svg = sceneRef.current.querySelector(".scene") as HTMLElement;
        if (!svg) return;

        if (initialRevealed) {
            svg.style.display = "block";
            const gift = document.querySelector(".gift");
            if (gift) gift.classList.add("hidden");

            gsap.set(svg.querySelector("#letters"), { opacity: 1 });
            return;
        }

        const letters = svg.querySelectorAll("#letters > *");

        function startScene() {
            setStarted(true);
            setLoading(false);

            for (let i = 0; i < letters.length; i++) {
                gsap.set(letters[i], {
                    transformOrigin: "center top",
                    rotationZ: Math.random() * 180,
                    scale: 0,
                });
            }
            copyAnim();
        }

        const openBox = async () => {
            const gift = document.querySelector(".gift");
            if (gift) gift.removeEventListener("click", openBox);

            if (gift) gift.removeEventListener("click", openBox);

            gsap.set(".hat", { transformOrigin: "left bottom" });
            gsap.to(".hat", { duration: 1, rotationZ: -80, x: -500, opacity: 0, ease: "power2.in" });
            gsap.to(".box", { duration: 1, y: 800, ease: "power2.in" });

            gsap.to(".box", { duration: 1, y: 800, ease: "power2.in" });

            gsap.to(".gift", {
                duration: 1,
                opacity: 0,
                delay: 1,
                onStart: function () {
                    (async () => {
                        setLoading(true);



                        let fpId = 'unknown';
                        try {
                            const fp = await import('@fingerprintjs/fingerprintjs');
                            const agent = await fp.load();
                            const result = await agent.get();
                            fpId = result.visitorId;
                        } catch (e) {
                            console.error("FP Load Error", e);
                            fpId = "fallback-" + Math.random();
                        }

                        try {
                            const res = await fetch('/api/christmas/attempt', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ fingerprint: fpId })
                            });
                            const data = await res.json();

                            if (data.inviteCode) {
                                setInternalInviteCode(data.inviteCode);
                            }
                        } catch (e) {
                            console.error("Attempt failed", e);
                        }

                        setTimeout(() => startScene(), 100);
                    })();
                },
                onComplete: function () {
                    const g = document.querySelector(".gift");
                    if (g) g.classList.add("hidden");
                }
            });
        };

        function startAnimations() { }

        function copyAnim() {
            gsap.to(svg.querySelector("#letters"), { duration: 0.1, opacity: 1 });
            gsap.to(letters, {
                duration: 3,
                scale: 1,
                rotationZ: 0,
                ease: "elastic.out(1, 0.3)",
                stagger: 0.1,
                onComplete: () => {
                    startAnimations();
                    setTimeout(() => {
                        const hasCode = document.querySelector("#letters text")?.textContent?.includes("INVITE");
                        if (hasCode) setShowCopyBtn(true);
                    }, 500);
                }
            });
        }

        const giftBtn = document.querySelector(".gift");
        if (giftBtn) giftBtn.addEventListener("click", openBox);

        svg.style.display = "block";

        return () => {
            if (giftBtn) giftBtn.removeEventListener("click", openBox);
        }
    }, [initialRevealed]);

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
    .cls-1{ fill: #fff; }
                      .cls-2{ fill: #e6e6e6; }
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

                {/* Result Area: Code or Coal */}
                <g id="letters" transform="translate(800, 300)" textAnchor="middle" opacity="0">
                    {internalInviteCode ? (
                        <g>
                            <text x="0" y="0" fill="#15803d" className="drop-shadow-md">INVITE CODE:</text>
                            <text x="0" y="80" fill="#16a34a" fontSize="100" fontWeight="bold" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }}>{internalInviteCode}</text>
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
            </svg>

            {/* Gift Box Overlay */}
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

            {/* Copy Button Overlay */}
            {internalInviteCode && showCopyBtn && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-1000 fill-mode-forwards opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                    <button
                        onClick={() => {
                            if (internalInviteCode) navigator.clipboard.writeText(internalInviteCode);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-lg shadow-[0_0_20px_rgba(22,163,74,0.6)] transition-all transform hover:scale-110 active:scale-95 border-2 border-green-400",
                            copied ? "bg-green-700 hover:bg-green-800" : "bg-green-600 hover:bg-green-500"
                        )}
                    >
                        {copied ? (
                            <>
                                <Check className="w-6 h-6" /> COPIED!
                            </>
                        ) : (
                            <>
                                <Copy className="w-6 h-6" /> COPY CODE
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
