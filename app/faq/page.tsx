import { HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata = {
    title: "FAQ - ByteHack",
    description: "Frequently Asked Questions - Quick answers to common onboarding and operations questions.",
};

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            <div className="max-w-[900px] mx-auto px-6 py-12 md:py-16 space-y-6">

                {/* Hero Section */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 md:p-12">
                    <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-6">
                        Support
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
                        Frequently Asked Questions
                    </h1>

                    <p className="text-base text-zinc-400 leading-relaxed max-w-2xl mb-8">
                        Quick answers to the most common onboarding and operations questions. If you need deeper help, ping a moderator or open a thread in the Support category.
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider text-zinc-400 uppercase hover:bg-white/10 transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Updated as policies change</span>
                    </div>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px] hover:border-white/10 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-3">How do I get access to posting permissions?</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Complete onboarding, enable 2FA, and participate in at least three existing threads. Moderation unlocks post access automatically when these checks clear.
                        </p>
                    </Card>

                    <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px] hover:border-white/10 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-3">Where can I download the latest tools?</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Compiled binaries ship through the Resources section of each guide. We never distribute executables via DMs — if someone does, flag it.
                        </p>
                    </Card>

                    <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px] hover:border-white/10 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-3">What happens if I trigger an anti-cheat ban?</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Post a detailed report in the Anti-Cheat Discussion category. Include timestamps, footage or logs, and the build you were running so we can triage patterns quickly.
                        </p>
                    </Card>

                    <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px] hover:border-white/10 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-3">Can I invite other researchers?</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Yes — use the invite flow on the Community page. Sponsors vouch for new members; mods review signals before admission.
                        </p>
                    </Card>
                </div>

            </div>
        </div>
    );
}
