"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Captcha } from "@/components/captcha";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        inviteCode: ""
    });
    const [captchaCode, setCaptchaCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        setLoading(true);
        let success = false;
        try {
            const captchaRes = await fetch("/api/auth/verify-captcha", {
                method: "POST",
                body: JSON.stringify({ code: captchaCode })
            });

            if (!captchaRes.ok) throw new Error("Invalid CAPTCHA");

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Registration failed");
            } else {
                toast.success("Account created! Logging in...");

                try {
                    const loginRes = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: formData.email,
                            password: formData.password
                        })
                    });

                    if (loginRes.ok) {
                        success = true;
                        toast.success("Welcome to ByteHack!");
                        router.push("/forum");
                        router.refresh();
                    } else {
                        setTimeout(() => router.push("/login"), 1000);
                    }
                } catch (loginErr) {
                    console.error("Auto-login failed:", loginErr);
                    setTimeout(() => router.push("/login"), 1000);
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Error creating account");
        } finally {
            if (!success) {
                setLoading(false);
            }
        }
    };

    const nextStep = () => {
        if (step === 1 && (!formData.username || !formData.email)) {
            toast.error("Please fill in all fields");
            return;
        }
        if (step === 2 && !formData.password) {
            toast.error("Please enter a password");
            return;
        }
        setStep(step + 1);
    };

    const goBack = () => {
        setStep(step - 1);
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome to ByteHack</h1>
                <div className="text-sm text-muted-foreground">
                    Already have an account? <Link href="/login" className="underline underline-offset-4 hover:text-primary">Sign in</Link>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -10, opacity: 0 }}
                            className="grid gap-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="invite">Invite Code</Label>
                                <Input
                                    id="invite"
                                    placeholder="INV-XXXXXXXX"
                                    value={formData.inviteCode}
                                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                                    className="font-mono text-center tracking-wider"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Hunter"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="button" onClick={nextStep} className="w-full">
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -10, opacity: 0 }}
                            className="grid gap-4"
                        >
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <button type="button" onClick={goBack} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                        <ArrowLeft className="w-3 h-3" /> Back
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        autoFocus
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button type="button" onClick={nextStep} className="w-full">
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -10, opacity: 0 }}
                            className="grid gap-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Security Check</span>
                                <button type="button" onClick={goBack} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> Back
                                </button>
                            </div>

                            <Captcha onVerify={setCaptchaCode} />

                            <Button onClick={handleRegister} className="w-full" disabled={loading || !captchaCode}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>

                            <p className="text-xs text-center text-muted-foreground px-4">
                                By creating an account, you agree to our <Link href="/rules" className="underline hover:text-primary">Rules</Link>.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}
