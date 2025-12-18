"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Captcha } from "@/components/captcha";
import { motion, AnimatePresence } from "framer-motion";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaCode, setCaptchaCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
    };

    const nextStep = () => {
        if (step === 1) {
            if (!email) {
                toast.error("Please enter email");
                return;
            }
            setStep(2);
            return;
        }
        if (step === 2) {
            if (!password) {
                toast.error("Please enter password");
                return;
            }
            setStep(3);
            return;
        }
    };

    const submitLogin = async () => {
        if (!captchaCode) {
            toast.error("Please complete the security check");
            return;
        }

        setLoading(true);
        let success = false;

        try {
            const supabase = createClient();

            const captchaRes = await fetch("/api/auth/verify-captcha", {
                method: "POST",
                body: JSON.stringify({ code: captchaCode })
            });

            if (!captchaRes.ok) {
                throw new Error("Invalid CAPTCHA");
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error(error.message);
            } else {
                success = true;
                toast.success("Welcome back!");
                router.push("/forum");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            if (!success) {
                setLoading(false);
            }
        }
    };

    const goBack = () => setStep(step - 1);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <div className="text-sm text-muted-foreground">
                    Don&apos;t have an account? <Link href="/register" className="underline underline-offset-4 hover:text-primary">Sign up</Link>
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
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
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
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        required
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') nextStep();
                                        }}
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
                                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
                                    Forgot password?
                                </Link>
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

                            <div className="py-2">
                                <Captcha onVerify={setCaptchaCode} />
                            </div>

                            <Button onClick={submitLogin} className="w-full" disabled={loading || !captchaCode}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Login
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-xs text-muted-foreground text-center px-2">
                    By signing in, you agree to our <Link href="/rules" className="underline hover:text-primary">Rules</Link>.
                </p>
            </form>
        </div>
    );
}
