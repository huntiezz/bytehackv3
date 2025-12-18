"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Shield, Lock, Mail, AlertTriangle, CheckCircle, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

interface SecuritySettingsProps {
    user: any;
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState(user.email || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [showMfaSetup, setShowMfaSetup] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [totpSecret, setTotpSecret] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState("");

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email === user.email) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/update-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Confirmation email sent to both addresses. Please verify to complete the change.");
            } else {
                toast.error(data.error || "Failed to update email");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/update-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Password updated successfully");
                setPassword("");
                setConfirmPassword("");
            } else {
                toast.error(data.error || "Failed to update password");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const startMfaSetup = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/mfa/enroll", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setQrCode(data.qr);
                setTotpSecret(data.secret);
                setShowMfaSetup(true);
            } else {
                toast.error(data.error || "Failed to start MFA setup");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const verifyMfaSetup = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/mfa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: verifyCode, secret: totpSecret }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("MFA Enabled Successfully!");
                setMfaEnabled(true);
                setShowMfaSetup(false);
            } else {
                toast.error(data.error || "Invalid code");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Email Change */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    Email Address
                </h3>
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Email Address</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            placeholder="Enter new email"
                        />
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            This will require email confirmation.
                        </p>
                    </div>
                    <Button type="submit" disabled={loading || email === user.email}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Email
                    </Button>
                </form>
            </Card>

            {/* Password Change */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    Change Password
                </h3>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">New Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            placeholder="••••••••"
                        />
                    </div>
                    <Button type="submit" disabled={loading || !password}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Password
                    </Button>
                </form>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="p-6 border-blue-500/20 bg-blue-500/5">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-400">
                            <Shield className="w-5 h-5" />
                            Two-Factor Authentication (2FA)
                        </h3>
                        <p className="text-sm text-blue-200/60 mb-4 max-w-md">
                            Protect your account with an extra layer of security. When enabled, using your username and password will also require a unique code from your mobile device.
                        </p>

                        {!showMfaSetup && !mfaEnabled && (
                            <Button onClick={startMfaSetup} variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                                <Smartphone className="w-4 h-4 mr-2" />
                                Enable 2FA
                            </Button>
                        )}

                        {showMfaSetup && (
                            <div className="space-y-4 mt-4 bg-black/40 p-4 rounded-lg border border-blue-500/20">
                                <div className="text-sm text-white/80">
                                    1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc).
                                </div>
                                {qrCode && (
                                    <div className="bg-white p-2 w-fit rounded-lg">
                                        <img src={qrCode} alt="QR Code" className="w-32 h-32" />
                                    </div>
                                )}

                                <div className="text-sm text-white/80 mt-2">
                                    2. Enter the 6-digit code from your app to verify.
                                </div>
                                <div className="flex gap-2 max-w-xs">
                                    <Input
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value)}
                                        placeholder="000 000"
                                        className="font-mono text-center tracking-widest"
                                        maxLength={6}
                                    />
                                    <Button onClick={verifyMfaSetup} disabled={loading || verifyCode.length < 6}>
                                        Verify
                                    </Button>
                                </div>
                            </div>
                        )}

                        {mfaEnabled && (
                            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">2FA is currently enabled</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
