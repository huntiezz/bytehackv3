"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, RefreshCw, Ticket, Calendar as CalendarIcon, Trash, Edit, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface InviteCode {
    code: string;
    created_at: string;
    max_uses: number | null;
    uses: number;
    expires_at: string | null;
    description: string | null;
    creator: { username: string };
}

export function InviteCodesManager() {
    const [codes, setCodes] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [customCode, setCustomCode] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
    const [description, setDescription] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchCodes = async () => {
        try {
            const res = await fetch("/api/admin/invites");
            if (res.ok) {
                const data = await res.json();
                setCodes(data);
            }
        } catch (error) {
            toast.error("Failed to fetch invite codes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleEdit = (invite: any) => {
        setEditingId(invite.id);
        setCustomCode(invite.code);
        setMaxUses(invite.max_uses ? invite.max_uses.toString() : "");
        setExpiresAt(invite.expires_at ? new Date(invite.expires_at) : undefined);
        setDescription(invite.description || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setCustomCode("");
        setMaxUses("");
        setExpiresAt(undefined);
        setDescription("");
    };

    const handleSubmit = async () => {
        setGenerating(true);
        try {
            if (editingId) {
                const res = await fetch("/api/admin/invites", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingId,
                        code: customCode,
                        maxUses: maxUses || null,
                        expiresAt: expiresAt ? expiresAt.toISOString() : null,
                        description: description
                    })
                });

                if (res.ok) {
                    toast.success("Invite code updated");
                    fetchCodes();
                    cancelEdit();
                } else {
                    toast.error("Failed to update code");
                }
            } else {
                const res = await fetch("/api/admin/invites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customCode,
                        maxUses: maxUses || null,
                        expiresAt: expiresAt ? expiresAt.toISOString() : null,
                        notes: description
                    })
                });

                if (res.ok) {
                    toast.success("Invite code generated");
                    fetchCodes();
                    setCustomCode("");
                    setMaxUses("");
                    setExpiresAt(undefined);
                    setDescription("");
                } else {
                    toast.error("Failed to generate code");
                }
            }
        } catch (error) {
            toast.error(editingId ? "Error updating code" : "Error generating code");
        } finally {
            setGenerating(false);
        }
    };

    const deleteCode = async (code: string) => {
        if (!confirm("Are you sure you want to delete this invite code?")) return;

        try {
            const res = await fetch(`/api/admin/invites?code=${code}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Invite code deleted");
                fetchCodes();
            } else {
                toast.error("Failed to delete code");
            }
        } catch (error) {
            toast.error("Error deleting code");
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Copied to clipboard");
    };

    const totalUses = codes.reduce((acc, code) => acc + (code.uses || 0), 0);

    return (
        <div className="flex gap-8 items-start">
            {/* Left Column: List */}
            <div className="flex-1 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Invite Codes</h3>
                    <p className="text-white/40 text-sm">Generate, track, and retire invite codes while you run the beta.</p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30 border-b border-white/5">
                        <div className="col-span-3">Code</div>
                        <div className="col-span-2">Usage</div>
                        <div className="col-span-2">Expires</div>
                        <div className="col-span-2">Owner</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>

                    {loading ? (
                        <div className="text-center p-8 text-white/40">Loading codes...</div>
                    ) : codes.length === 0 ? (
                        <div className="text-center p-12 bg-[#0A0A0A] border border-white/5 rounded-xl text-white/40 border-dashed">
                            No invite codes generated yet.
                        </div>
                    ) : (
                        codes.map((invite: any) => {
                            const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date();
                            const isExhausted = invite.max_uses && invite.uses >= invite.max_uses;
                            const remaining = invite.max_uses ? invite.max_uses - invite.uses : '∞';

                            return (
                                <div key={invite.code} className="grid grid-cols-12 gap-4 px-4 py-4 items-center bg-[#0A0A0A] border border-white/5 rounded-[16px] hover:border-white/10 transition-colors group">
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <code className="text-white font-bold font-mono tracking-wider">{invite.code}</code>
                                            <button onClick={() => copyCode(invite.code)} className="text-white/20 hover:text-white transition-colors">
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                                            Created {format(new Date(invite.created_at), 'd MMM yyyy, HH:mm')}
                                        </div>
                                        {invite.description && (
                                            <div className="text-xs text-white/40 mt-1 truncate max-w-[200px]" title={invite.description}>
                                                {invite.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <div className="text-sm font-bold text-white mb-0.5">
                                            {invite.uses} <span className="text-white/30">/</span> {invite.max_uses || '∞'}
                                        </div>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isExhausted ? 'text-red-500' : 'text-white/30'}`}>
                                            Remaining: {remaining}
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <div className={`text-sm font-bold ${isExpired ? 'text-red-500' : 'text-white'}`}>
                                            {invite.expires_at ? format(new Date(invite.expires_at), 'd MMM yyyy') : 'Never'}
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-sm text-white/60">
                                        {invite.creator?.username || 'By System'}
                                    </div>

                                    <div className="col-span-3 flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white"
                                            onClick={() => handleEdit(invite)}
                                        >
                                            <Edit className="w-3 h-3 mr-1.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-[10px] font-bold uppercase tracking-wider text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                                            onClick={() => deleteCode(invite.code)}
                                        >
                                            <Trash className="w-3 h-3 mr-1.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Column: Create Form */}
            <div className="w-[400px]">
                <Card className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[24px] sticky top-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-white">{editingId ? "Edit Invite Code" : "Create invite code"}</h3>
                        {editingId && (
                            <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-6 text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-wider">
                                Cancel
                            </Button>
                        )}
                    </div>

                    <p className="text-white/40 text-xs mb-6 leading-relaxed">
                        {editingId ? "Update the details for this invite code." : "Leave the code blank to auto-generate one. Set max uses to blank for unlimited access."}
                    </p>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="customCode" className="text-[10px] font-bold uppercase tracking-widest text-white/50">{editingId ? "Code" : "Custom Code"}</Label>
                                <Input
                                    id="customCode"
                                    placeholder="BETA-ACCESS-2026"
                                    className="bg-[#050505] border-white/10 text-white placeholder:text-white/20 text-xs h-10 font-mono"
                                    value={customCode}
                                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="maxUses" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Max Uses</Label>
                                <Input
                                    id="maxUses"
                                    placeholder="1"
                                    type="number"
                                    min="1"
                                    className="bg-[#050505] border-white/10 text-white placeholder:text-white/20 text-xs h-10"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiresAt" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Expires</Label>
                            <div className="relative">
                                <Input
                                    id="expiresAt"
                                    type="datetime-local"
                                    className="bg-[#050505] border-white/10 text-white placeholder:text-white/20 text-xs h-10 w-full calendar-picker-indicator-invert"
                                    value={expiresAt ? format(expiresAt, "yyyy-MM-dd'T'HH:mm") : ""}
                                    onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value) : undefined)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Invite for internal QA group."
                                className="bg-[#050505] border-white/10 text-white placeholder:text-white/20 min-h-[100px] text-xs resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                                Total uses: {totalUses}
                            </div>
                            <Button onClick={handleSubmit} disabled={generating} className="bg-white text-black hover:bg-white/90 font-bold text-xs px-6 rounded-full uppercase tracking-wider">
                                {generating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                                {editingId ? "Update code" : "Generate code"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
