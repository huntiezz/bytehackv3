"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Gift } from "lucide-react";
import toast from "react-hot-toast";
import { getChristmasSettings, getChristmasStats, toggleChristmasEvent } from "@/app/actions/christmas-admin";

export function AdminChristmasManager() {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generatedCount, setGeneratedCount] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [settingsRes, statsRes] = await Promise.all([
            getChristmasSettings(),
            getChristmasStats()
        ]);

        if (settingsRes && typeof settingsRes.is_enabled === 'boolean') {
            setEnabled(settingsRes.is_enabled);
        }

        if (statsRes && typeof statsRes.count === 'number') {
            setGeneratedCount(statsRes.count);
        }

        setLoading(false);
    };

    const handleToggle = async (checked: boolean) => {
        // Optimistic update
        const prev = enabled;
        setEnabled(checked);

        const res = await toggleChristmasEvent(checked);
        if (res.error) {
            toast.error(res.error);
            setEnabled(prev);
        } else {
            toast.success(checked ? "Christmas Event Enabled" : "Christmas Event Disabled");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Christmas Event</h2>
                <p className="text-white/40">Manage the holiday event details and status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            onCheckedChange={handleToggle}
                            disabled={loading}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                </div>

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
