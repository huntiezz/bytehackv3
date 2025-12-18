import { Users, Calendar, Shield, Share2, Heart, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata = {
    title: "About - ByteHack",
    description: "Inside ByteHack - A collective of developers, reverse engineers, and competitive players.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            <div className="max-w-[900px] mx-auto px-6 py-12 md:py-16 space-y-6">

                {/* Hero Section */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 md:p-12 overflow-hidden relative">
                    {/* Background decoration/glow could go here if needed, keeping it clean for 1:1 match */}

                    <div className="relative z-10 max-w-2xl">
                        <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-6">
                            Who We Are
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
                            Inside ByteHack
                        </h1>

                        <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-xl mb-8">
                            ByteHack is a collective of developers, reverse engineers, and competitive players who believe in transparent research and accessible tooling. We operate at the edge of anti-cheat technologies while keeping members protected and informed.
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider text-zinc-400 uppercase hover:bg-white/10 transition-colors">
                                <Users className="w-3 h-3" />
                                <span>18 Core Maintainers</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider text-zinc-400 uppercase hover:bg-white/10 transition-colors">
                                <Calendar className="w-3 h-3" />
                                <span>Established 2017</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px] flex flex-col h-full hover:border-white/10 transition-colors">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white mb-3">Security-first delivery</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                We build tooling defensively. Every release goes through threat modelling, logging review, and red-team validation before it touches production.
                            </p>
                        </div>
                    </Card>

                    <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px] flex flex-col h-full hover:border-white/10 transition-colors">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white mb-3">Shared intelligence</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                ByteHack exists to amplify signal. We publish ready-to-run examples, telemetry, and mitigations so every member levels up together.
                            </p>
                        </div>
                    </Card>

                    <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px] flex flex-col h-full hover:border-white/10 transition-colors">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white mb-3">Community-backed</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                Nothing here is paywalled or siloed. Contributors earn trust through action — documenting discoveries, mentoring newcomers, and keeping the stack healthy.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* How We Operate Section */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 md:p-12">
                    <h2 className="text-xl font-bold text-white mb-8">How we operate</h2>

                    <ul className="space-y-4">
                        <li className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2.5" />
                            <span className="text-zinc-400 leading-relaxed text-sm">
                                Weekly release trains covering tooling updates, ban-wave intel, and contributor shout-outs.
                            </span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2.5" />
                            <span className="text-zinc-400 leading-relaxed text-sm">
                                Real-time presence via Supabase, so threads, replies, and profile updates land instantly.
                            </span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2.5" />
                            <span className="text-zinc-400 leading-relaxed text-sm">
                                Zero tolerance for data leaks, harassment, or selling ByteHack IP — actions are audited and enforced.
                            </span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2.5" />
                            <span className="text-zinc-400 leading-relaxed text-sm">
                                Open-source mindset: where possible, our utilities ship with docs and reproducible builds.
                            </span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    );
}
