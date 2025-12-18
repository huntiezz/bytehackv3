"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Laptop, Phone, Globe, Trash2, ShieldCheck, MapPin } from "lucide-react";
import { UAParser } from "ua-parser-js";

interface SessionManagerProps {
    sessions: any[];
}

export function SessionManager({ sessions }: SessionManagerProps) {

    const handleRevoke = (sessionId: string) => {
        alert("Revoke logic would go here - usually requires deleting the refresh token from DB or Supabase Auth API");
    };

    const getSessionDetails = (userAgent: string) => {
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();

        const browserName = browser.name || "Unknown Browser";
        const osName = os.name || "Unknown OS";
        const deviceType = device.type === 'mobile' ? 'Mobile' : 'Desktop';

        return { browserName, osName, deviceType };
    };

    const getDeviceIcon = (userAgent: string = "") => {
        if (userAgent.toLowerCase().includes("mobile")) return <Phone className="w-5 h-5" />;
        return <Laptop className="w-5 h-5" />;
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-6 h-6 text-green-500" />
                <div>
                    <h3 className="text-lg font-semibold">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground">Manage your active logins across devices.</p>
                </div>
            </div>

            <div className="space-y-4">
                {sessions && sessions.length > 0 ? (
                    sessions.map((session, i) => {
                        const { browserName, osName } = getSessionDetails(session.user_agent || "");

                        return (
                            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-secondary/40 rounded-full">
                                        {getDeviceIcon(session.user_agent)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {session.ip_address}
                                            {i === 0 && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Recent</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> {browserName} on {osName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {session.location || "Unknown Location"}
                                            </span>
                                            <span>
                                                Last active: {formatDistanceToNow(new Date(session.created_at || new Date()), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {i !== 0 && (
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRevoke(session.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-secondary/40 rounded-full">
                                <Laptop className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium text-sm text-green-400">Current Session</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    You are currently logged in on this device.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
