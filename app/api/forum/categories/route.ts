import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserAllowedCategories } from "@/lib/forum-permissions";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json([
                "General Discussion",
                "Coding Discussion",
                "Cheat Discussion",
                "CS2", "Fortnite", "FiveM", "Rust", "Minecraft",
                "Coding", "Cheats", "SDK", "Game Reversal", "Offsets", "Spoofer"
            ]);
        }

        const permittedCategories = await getUserAllowedCategories(user.id);
        return NextResponse.json(permittedCategories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
