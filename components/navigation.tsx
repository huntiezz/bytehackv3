'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/mobile-nav";
import { UserNavDropdown } from "@/components/user-nav-dropdown";
import { NotificationsPopover } from "@/components/notifications-popover";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { cn } from "@/lib/utils";
import { Folder, Swords, Info, ShoppingBag } from "lucide-react";

interface NavigationProps {
  user?: any;
  isAdmin?: boolean;
  isOffsetUpdater?: boolean;
}

export function Navigation({ user, isAdmin = false, isOffsetUpdater = false }: NavigationProps) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Forums", href: "/forum", icon: Folder },
    { name: "Offsets", href: "/offsets", icon: Folder },
    { name: "Code Off", href: "/code-off", icon: Swords },
    { name: "Products", href: "/products", icon: ShoppingBag },
    { name: "About", href: "/about", icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Left: Logo & Main Nav */}
        <div className="flex items-center gap-8">


          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full",
                    isActive
                      ? "text-white bg-white/10"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">

          {user ? (
            <div className="hidden md:flex items-center gap-4">
              {pathname?.startsWith('/forum') && (
                <div className="w-64">
                  <SearchBar />
                </div>
              )}
              <NotificationsPopover currentUserId={user.id} />
              <UserNavDropdown user={user} />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-zinc-400 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-zinc-200 rounded-full font-bold">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <MobileNav user={user} isAdmin={isAdmin} isOffsetUpdater={isOffsetUpdater} />
          </div>
        </div>
      </div>
    </nav>
  );
}
