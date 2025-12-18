"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const categories = ["All", "CS2", "Fortnite", "Spoofer", "FiveM", "Rust", "Minecraft", "Game Reversal", "SDK", "Offsets"];

export function ForumFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`/forum?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          className="pl-10"
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => {
            const value = e.target.value;
            const timeoutId = setTimeout(() => updateFilters('search', value), 300);
            return () => clearTimeout(timeoutId);
          }}
        />
      </div>

      {/* Category Filter */}
      <div className="md:hidden w-full sm:w-[180px]">
        <Select
          defaultValue={searchParams.get('category') || 'All'}
          onValueChange={(value) => updateFilters('category', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <Select
        defaultValue={searchParams.get('sort') || 'recent'}
        onValueChange={(value) => updateFilters('sort', value)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="likes">Most Liked</SelectItem>
          <SelectItem value="comments">Most Comments</SelectItem>
          <SelectItem value="views">Most Views</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
