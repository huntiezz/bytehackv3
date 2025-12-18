"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error("Failed to send request");

            setSent(true);
            toast.success("Reset link sent if account exists.");
        } catch (error) {
            toast.error("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 bg-background pb-60">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm flex flex-col gap-6"
            >
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Reset Password</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email to receive a reset link
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Send Reset Link
                        </Button>
                        <Link href="/login" className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary gap-2 mt-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </form>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-center border p-6 rounded-lg border-zinc-800 bg-zinc-900/50">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Check your inbox</h3>
                            <p className="text-sm text-muted-foreground">
                                We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>.
                            </p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                            Try another email
                        </Button>
                        <Link href="/login" className="text-xs text-muted-foreground hover:underline">
                            Back to login
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
