'use client';

import Link from "next/link";
import { MessageSquare, Code2, ShoppingBag } from "lucide-react";

export function ToastNavigation() {
    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                    <span className="font-black text-sm tracking-wide text-white">BYTEHACK</span>
                </Link>

                {/* Divider */}
                <div className="h-4 w-px bg-white/10" />

                {/* Nav Links */}
                <div className="flex items-center gap-6">
                    <Link
                        href="/forum"
                        className="group flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Forum
                    </Link>

                    <Link
                        href="/offsets"
                        className="group flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
                    >
                        <Code2 className="h-3.5 w-3.5" />
                        Offsets
                    </Link>

                    <Link
                        href="/products"
                        className="group flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
                    >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Products
                    </Link>
                </div>
            </div>
        </nav>
    );
}
