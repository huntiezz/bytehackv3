"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

export function AdminNotificationSender() {
    const [targetType, setTargetType] = useState<"all" | "specific">("specific");
    const [userId, setUserId] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!message) {
            toast.error("Message is required");
            return;
        }

        if (targetType === "specific" && !userId) {
            toast.error("User ID is required for specific notifications");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetType,
                    userId: targetType === "specific" ? userId : null,
                    title,
                    message
                }),
            });

            if (res.ok) {
                toast.success("Notification sent successfully");
                setTitle("");
                setMessage("");
                if (targetType === "specific") setUserId("");
            } else {
                toast.error("Failed to send notification");
            }
        } catch (error) {
            toast.error("Error sending notification");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="p-6 bg-[#0A0A0A] border border-white/5 rounded-xl max-w-2xl">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-white">Target Audience</Label>
                    <Select value={targetType} onValueChange={(v: "all" | "specific") => setTargetType(v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="specific">Specific User</SelectItem>
                            <SelectItem value="all">All Users</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {targetType === "specific" && (
                    <div className="space-y-2">
                        <Label className="text-white">User ID</Label>
                        <Input
                            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-white">Title (Optional)</Label>
                    <Input
                        placeholder="System Announcement"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-white">Message</Label>
                    <Textarea
                        placeholder="Enter your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[120px]"
                    />
                </div>

                <div className="pt-2 flex justify-end">
                    <Button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-white text-black hover:bg-white/90"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Send Notification
                    </Button>
                </div>
            </div>
        </Card>
    );
}
