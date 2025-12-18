'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ShoppingBag, Settings, Code2, LogOut, Download, Shield, ChevronDown, Folder, BookOpen, Info, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { MobileNav } from "@/components/mobile-nav";
import { useState, useEffect, useRef } from "react";
import { UserNavDropdown } from "@/components/user-nav-dropdown";
import { NotificationsPopover } from "@/components/notifications-popover";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search-bar";

interface NavigationProps {
  user?: any;
  isAdmin?: boolean;
  isOffsetUpdater?: boolean;
}

const tutorials = [
  { name: "All Tutorials", href: "/forum/tutorials" },
  { name: "Beginner Guides", href: "/forum/tutorials" },
  { name: "Advanced Techniques", href: "/forum/tutorials" },
  { name: "Video Tutorials", href: "/forum/tutorials" },
];

const guides = [
  { name: "All Guides", href: "/forum/guides" },
  { name: "Setup Guides", href: "/forum/guides" },
  { name: "Workflow & Automation", href: "/forum/guides" },
  { name: "Optimization", href: "/forum/guides" },
  { name: "Game Forums", href: "/forum/games" },
  { name: "Tool Forums", href: "/forum/tools" },
];

const antiCheatInfo = [
  { name: "All Anti-cheat", href: "/forum/anti-cheat" },
  { name: "Bypasses", href: "/forum/anti-cheat" },
  { name: "AC Analysis", href: "/forum/anti-cheat" },
  { name: "Discussion", href: "/forum/anti-cheat" },
];

const infoLinks = [
  { name: "About Us", href: "/about" },
  { name: "Rules", href: "/rules" },
  { name: "FAQ", href: "/faq" },
];

function NavItem({ href, children, icon: Icon, isActive }: { href: string; children: React.ReactNode; icon: any; isActive?: boolean }) {
  return (
    <Link
      href={href}
      className={`
                group flex items-center gap-2 text-sm font-medium transition-colors relative h-16 px-1
                ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}
            `}
    >
      <Icon className="h-4 w-4" />
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
      )}
    </Link>
  );
}

function NavDropdown({
  label,
  icon: Icon,
  items,
  isActive
}: {
  label: string;
  icon: any;
  items: { name: string; href: string }[]
  isActive?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      className="relative h-16 flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`
            group flex items-center gap-2 text-sm font-medium transition-colors px-1 h-full relative
            ${isActive || isOpen ? 'text-white' : 'text-zinc-400 hover:text-white'}
          `}
      >
        <Icon className="h-4 w-4" />
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 text-zinc-500 group-hover:text-white ${isOpen ? 'rotate-180' : ''}`} />

        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%-10px)] left-0 w-64 pt-4">
          <div className="bg-[#050505] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors group/item"
              >
                <span>{item.name}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover/item:text-white transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navigation({ user, isAdmin = false, isOffsetUpdater = false }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-white/5 h-16">
      <div className="max-w-[1400px] mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left Side: Nav Links */}
          <div className="hidden md:flex items-center gap-5 h-full">
            <NavItem href="/forum" icon={Folder} isActive={pathname?.startsWith('/forum')}>
              Forums
            </NavItem>

            <NavDropdown
              label="Tutorials"
              icon={Folder}
              items={tutorials}
              isActive={pathname?.startsWith('/tutorials')}
            />

            <NavDropdown
              label="Guides"
              icon={Folder}
              items={guides}
              isActive={pathname?.startsWith('/guides')}
            />

            <NavDropdown
              label="Anti-cheat"
              icon={Folder}
              items={antiCheatInfo}
              isActive={pathname?.startsWith('/anti-cheat')}
            />

            <NavItem href="/offsets" icon={Folder} isActive={pathname?.startsWith('/offsets')}>
              Offsets
            </NavItem>

            <NavDropdown
              label="Info"
              icon={Folder}
              items={infoLinks}
              isActive={pathname?.startsWith('/about') || pathname?.startsWith('/rules') || pathname?.startsWith('/contact')}
            />
          </div>

          {/* Right Side: User & Mobile */}
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <div className="md:hidden">
              <MobileNav user={user} isAdmin={isAdmin} isOffsetUpdater={isOffsetUpdater} />
            </div>

            {user ? (
              <div className="flex items-center gap-5">
                {pathname?.startsWith('/forum') && (
                  <div className="mr-2">
                    <SearchBar />
                  </div>
                )}
                <NotificationsPopover currentUserId={user.id} />
                <UserNavDropdown user={user} />
              </div>
            ) : (
              <Link href="/login">
                <Button variant="default" className="bg-white text-black hover:bg-white/90 font-medium rounded-full px-6">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
