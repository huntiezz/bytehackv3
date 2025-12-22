"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

interface EmailVerificationModalProps {
    userEmail?: string | null;
    isVerified?: boolean;
}

export function EmailVerificationModal({ userEmail, isVerified }: EmailVerificationModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState(userEmail || "");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        if (!isVerified && pathname?.startsWith("/forum") && pathname !== "/") {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [isVerified, pathname]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSendCode = async () => {
        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/send-verification", {
                method: "POST",
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Verification code sent!");
                setStep(2);
                setCooldown(60);
            } else {
                toast.error(data.error || "Failed to send code");
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) {
            toast.error("Please enter the 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                body: JSON.stringify({ email, code })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Email verified!");
                setStep(3);
                setTimeout(() => setIsOpen(false), 2000);
            } else {
                toast.error(data.error || "Invalid code");
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/signout", { method: "POST" });
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-md bg-[#09090b] border-[#27272a] [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {step === 3 ? <CheckCircle2 className="text-green-500" /> : <Mail className="text-primary" />}
                        {step === 3 ? "Email Verified" : "Verify Your Email"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {step === 1 && "Please enter your email address to continue."}
                        {step === 2 && `We've sent a 6-digit code to ${email}`}
                        {step === 3 && "Your email has been successfully verified."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 1 && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-[#09090b] border-[#27272a]"
                                />
                            </div>
                            <Button onClick={handleSendCode} disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Verification Code
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="text-center text-2xl tracking-[1em] font-mono bg-[#09090b] border-[#27272a]"
                                />
                            </div>
                            <Button onClick={handleVerify} disabled={loading || code.length < 6} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify Email
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleSendCode}
                                disabled={loading || cooldown > 0}
                                className="text-xs text-muted-foreground"
                            >
                                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive a code? Resend"}
                            </Button>
                            <button
                                onClick={() => setStep(1)}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
                            >
                                Change email address
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <p className="text-sm text-muted-foreground">Redirecting you in a moment...</p>
                        </div>
                    )}

                    {step !== 3 && (
                        <div className="mt-4 text-center border-t border-[#27272a] pt-4">
                            <button
                                onClick={handleLogout}
                                className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
