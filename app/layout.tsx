import type { Metadata } from "next";

export const runtime = 'edge';


import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./username-effects.css";
import { ConditionalLayoutWrapper } from "@/components/conditional-layout-wrapper";
import { ToastProvider } from "@/components/toast-provider";
import { PresenceUpdater } from "@/components/presence-updater";
import { PasswordRecoveryListener } from "@/components/auth/password-recovery-listener";
import { Analytics } from "@vercel/analytics/next";
import { Snowfall } from "@/components/snowfall";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const proggyClean = localFont({
  src: "../fonts/ProggyClean.ttf",
  variable: "--font-proggy",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ByteForum - Community Hub",
    template: "%s | ByteForum",
  },
  description: "A modern game hacking community forum reboot.",
  keywords: ["gaming", "offsets", "community", "marketplace", "CS2", "Fortnite", "game hacking"],
  authors: [{ name: "ByteHack" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "ByteForum",
    title: "ByteForum - Community Hub",
    description: "A modern game hacking community forum reboot.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "ByteHack LOGO",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ByteForum - Community Hub",
    description: "A modern game hacking community forum reboot.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { TosMonitor } from "@/components/tos-monitor";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${proggyClean.variable} font-sans antialiased`}>
        <Snowfall />
        <ToastProvider />
        <ConditionalLayoutWrapper />
        <PresenceUpdater />
        <PasswordRecoveryListener />
        <TosMonitor />
        <main>
          {children}
          <Analytics />
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
