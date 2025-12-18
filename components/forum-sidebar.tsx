"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Gamepad2,
    Terminal,
    Search,
    Globe,
    Code2,
    Monitor,
    ShieldAlert,
    Hash,
    Box
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const GAMES = [
    { name: "CS2", image: "/cs2.png" },
    { name: "Fortnite", image: "/fortnite.png" },
    { name: "FiveM", image: "/fivem.png" },
    { name: "Rust", image: "/rust.png" },
    { name: "Minecraft", image: "/minecraft.png" },
];

const TOPICS = [
    { name: "Spoofer", icon: Monitor },
    { name: "Game Reversal", icon: Code2 },
    { name: "SDK", icon: Terminal },
    { name: "Offsets", icon: Hash },
];

export function ForumSidebar() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentCategory = searchParams.get("category");
    const [gameSearch, setGameSearch] = useState("");

    const handleCategoryClick = (category: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (category) {
            params.set("category", category);
        } else {
            params.delete("category");
        }
        router.push(`/forum?${params.toString()}`);
    };

    const filteredGames = GAMES.filter(g =>
        g.name.toLowerCase().includes(gameSearch.toLowerCase())
    );

    return (
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            {/* Search Games */}
            <div className="space-y-2">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2">
                    Find Community
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                    <Input
                        placeholder="Search games..."
                        className="h-9 pl-9 bg-white/5 border-white/10 text-sm focus:bg-white/10 transition-colors"
                        value={gameSearch}
                        onChange={(e) => setGameSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Categories */}
            <div className="space-y-1">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5",
                        !currentCategory && "bg-white/10 text-white"
                    )}
                    onClick={() => handleCategoryClick(null)}
                >
                    <Globe className="h-4 w-4" />
                    All Posts
                </Button>
            </div>

            {/* Games List */}
            <div className="space-y-1">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2 py-2">
                    Games
                </h3>
                {filteredGames.length === 0 ? (
                    <p className="text-xs text-white/30 px-2">No games found</p>
                ) : (
                    filteredGames.map((game) => (
                        <Button
                            key={game.name}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5",
                                currentCategory === game.name && "bg-white/10 text-white"
                            )}
                            onClick={() => handleCategoryClick(game.name)}
                        >
                            <div className="relative w-4 h-4">
                                <Image
                                    src={game.image}
                                    alt={game.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            {game.name}
                        </Button>
                    ))
                )}
            </div>

            {/* Topics List */}
            <div className="space-y-1">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2 py-2">
                    Topics
                </h3>
                {TOPICS.map((topic) => (
                    <Button
                        key={topic.name}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5",
                            currentCategory === topic.name && "bg-white/10 text-white"
                        )}
                        onClick={() => handleCategoryClick(topic.name)}
                    >
                        <topic.icon className="h-4 w-4" />
                        {topic.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}
