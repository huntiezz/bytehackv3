"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function CreateMatchDialog({ userId }: { userId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState("");
    const [description, setDescription] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleCreate = async () => {
        if (!topic) return toast.error("Topic is required");

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("code_matches")
                .insert({
                    player1_id: userId,
                    topic,
                    description,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Challenge created!");
            setOpen(false);
            router.refresh();
            router.push(`/code-off/${data.id}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold tracking-wide border-0 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    <Plus className="w-5 h-5 mr-2" />
                    CREATE CHALLENGE
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Create Code Off Challenge</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Topic / Challenge Name</Label>
                        <Input
                            placeholder="e.g. Build a Todo App in 10 mins"
                            className="bg-black/50 border-white/10"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description / Rules (Optional)</Label>
                        <Textarea
                            placeholder="Specific constraints, forbidden libraries, etc."
                            className="bg-black/50 border-white/10 min-h-[100px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={handleCreate}
                        disabled={loading || !topic}
                        className="w-full bg-white text-black hover:bg-zinc-200 mt-4"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Challenge
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
