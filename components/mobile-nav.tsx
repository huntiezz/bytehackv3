"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  MessageSquare,
  ShoppingBag,
  Settings,
  Code2,
  User,
  LogOut,
  X,
  Folder,
  BookOpen,
  Shield,
  Info,
  ChevronDown,
  Download
} from "lucide-react";
import Image from "next/image";

interface MobileNavProps {
  user: any;
  isAdmin?: boolean;
  isOffsetUpdater?: boolean;
}

const tutorials = [
  { name: "Getting Started", href: "/tutorials/getting-started" },
  { name: "Reverse Engineering", href: "/tutorials/reverse-engineering" },
  { name: "Memory Editing", href: "/tutorials/memory-editing" },
  { name: "Pattern Scanning", href: "/tutorials/pattern-scanning" },
];

const guides = [
  { name: "Setup Guide", href: "/guides/setup" },
  { name: "Best Practices", href: "/guides/best-practices" },
  { name: "Security", href: "/guides/security" },
  { name: "FAQ", href: "/guides/faq" },
];

const antiCheatInfo = [
  { name: "EAC", href: "/anti-cheat/eac" },
  { name: "BattlEye", href: "/anti-cheat/battleye" },
  { name: "Vanguard", href: "/anti-cheat/vanguard" },
  { name: "VAC", href: "/anti-cheat/vac" },
];

const infoLinks = [
  { name: "About", href: "/about" },
  { name: "Rules", href: "/rules" },
  { name: "Contact", href: "/contact" },
];

function CollapsibleSection({
  title,
  icon: Icon,
  items,
  onItemClick
}: {
  title: string;
  icon: any;
  items: { name: string; href: string }[];
  onItemClick: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button
        variant="ghost"
        className="w-full justify-between gap-3 h-12"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {title}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      {isOpen && (
        <div className="pl-8 space-y-1 mb-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={onItemClick}>
              <Button variant="ghost" className="w-full justify-start h-10 text-sm text-muted-foreground hover:text-foreground">
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileNav({ user, isAdmin = false, isOffsetUpdater = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold">Menu</h2>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
            {user && (
              <>
                <Link href="/account" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                    {user.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt={user.display_name || user.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{user.display_name || user.name}</span>
                      {(isAdmin || isOffsetUpdater) && (
                        <Badge variant={isAdmin ? "destructive" : "default"} className="text-xs mt-1">
                          {isAdmin ? "Admin" : "Updater"}
                        </Badge>
                      )}
                    </div>
                  </Button>
                </Link>
                <div className="border-t my-2" />
              </>
            )}

            <Link href="/forum" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                <Folder className="h-5 w-5" />
                Forums
              </Button>
            </Link>

            <CollapsibleSection
              title="Tutorials"
              icon={BookOpen}
              items={tutorials}
              onItemClick={() => setOpen(false)}
            />

            <CollapsibleSection
              title="Guides"
              icon={Code2}
              items={guides}
              onItemClick={() => setOpen(false)}
            />

            <CollapsibleSection
              title="Anti-cheat"
              icon={Shield}
              items={antiCheatInfo}
              onItemClick={() => setOpen(false)}
            />

            <CollapsibleSection
              title="Info"
              icon={Info}
              items={infoLinks}
              onItemClick={() => setOpen(false)}
            />

            <Link href="/products" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                <ShoppingBag className="h-5 w-5" />
                Products
              </Button>
            </Link>

            {isOffsetUpdater && (
              <Link href="/offset-updater" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                  <Download className="h-5 w-5" />
                  Updater Panel
                </Button>
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                  <Settings className="h-5 w-5" />
                  Admin Panel
                </Button>
              </Link>
            )}

            <div className="flex-1" />

            {user ? (
              <form action="/api/auth/signout" method="post" className="border-t pt-4">
                <Button variant="outline" className="w-full gap-2 h-12" type="submit">
                  <LogOut className="h-5 w-5" />
                  Sign out
                </Button>
              </form>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button
                  className="w-full bg-white text-black hover:bg-white/90 gap-2 h-12"
                >
                  <Shield className="w-5 h-5" />
                  Sign in
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
