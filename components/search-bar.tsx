"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState("");

    useEffect(() => {

        setQuery(searchParams?.get("q") || "");
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/forum/search?q=${encodeURIComponent(query.trim())}`);
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-sm hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search forum..."
                className="pl-9 h-9 bg-zinc-900 border-zinc-800 focus:bg-black transition-colors rounded-full"
            />
        </form>
    );
}
