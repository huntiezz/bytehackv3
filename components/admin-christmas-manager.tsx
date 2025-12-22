
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function AdminChristmasManager() {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generatedCount, setGeneratedCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        fetchSettings();
        fetchStats();
    }, []);

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('christmas_settings')
            .select('is_enabled')
            .single();

        if (data) {
            setEnabled(data.is_enabled);
        }
        setLoading(false);
    };

    const fetchStats = async () => {
        // Count attempts that resulted in an invite code
        const { count } = await supabase
            .from('christmas_attempts')
            .select('*', { count: 'exact', head: true })
            .not('invite_code', 'is', null);

        if (count !== null) setGeneratedCount(count);
    };

    const toggleChristmas = async (checked: boolean) => {
        setLoading(true);
        const { error } = await supabase
            .from('christmas_settings')
            .update({ is_enabled: checked })
            .eq('id', true);

        if (error) {
            toast.error("Failed to update settings");
            console.error(error);
        } else {
            setEnabled(checked);
            toast.success(checked ? "Christmas Event Enabled" : "Christmas Event Disabled");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Christmas Event</h2>
                <p className="text-white/40">Manage the holiday event details and status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[24px] flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">EVENT STATUS</div>
                        <div className="text-2xl font-bold text-white flex items-center gap-3">
                            {enabled ? (
                                <span className="text-green-500 flex items-center gap-2">● Active</span>
                            ) : (
                                <span className="text-red-500 flex items-center gap-2">● Disabled</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-white/60 font-bold uppercase tracking-wider">{enabled ? 'ON' : 'OFF'}</span>
                        <Switch
                            checked={enabled}
                            onCheckedChange={toggleChristmas}
                            disabled={loading}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                </div>

                {/* Stats Card */}
                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[24px]">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">CODES GENERATED</div>
                    <div className="text-4xl font-bold text-white flex items-center gap-4">
                        <Gift className="w-8 h-8 text-red-500" />
                        {generatedCount}
                    </div>
                </div>
            </div>
        </div>
    );
}
