"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Check, Type, Sparkles, Palette } from "lucide-react";

const FONTS = [
    { id: "default", name: "Default", family: "inherit" },
    { id: "mono", name: "Monospace", family: "monospace" },
    { id: "serif", name: "Serif", family: "serif" },
    { id: "comicsans", name: "Comic Sans", family: '"Comic Sans MS", "Chalkboard SE", sans-serif' },
    { id: "impact", name: "Impact", family: "Impact, sans-serif" },
    { id: "courier", name: "Courier", family: '"Courier New", Courier, monospace' },
    { id: "verdana", name: "Verdana", family: "Verdana, Geneva, sans-serif" },
    { id: "georgia", name: "Georgia", family: "Georgia, serif" },
    { id: "trebuchet", name: "Trebuchet", family: '"Trebuchet MS", sans-serif' },
    { id: "arial", name: "Arial", family: "Arial, sans-serif" },
];

const EFFECTS = [
    { id: "none", name: "None", description: "Default styling" },
    { id: "glow", name: "Glow", description: "Soft outer glow" },
    { id: "neon", name: "Neon", description: "Bright neon tubing" },
    { id: "glitch", name: "Glitch", description: "Digital distortion" },
    { id: "rainbow", name: "Rainbow", description: "Cycling colors" },
    { id: "gradient", name: "Gradient", description: "Smooth color shift" },
    { id: "fire", name: "Fire", description: "Animated flames" },
    { id: "electric", name: "Electric", description: "Shocking blue energy" },
    { id: "wave", name: "Wave", description: "Bouncing animation" },
    { id: "sparkles", name: "Sparkles", description: "Floating stars" },
    { id: "stars", name: "Stars", description: "Twinkling starfield" },
    { id: "hearts", name: "Hearts", description: "Floating hearts" },
    { id: "snow", name: "Snow", description: "Falling snowflakes" },
    { id: "blur", name: "Blur", description: "Focus pulse" },
    { id: "chromatic", name: "Chromatic", description: "RGB separation" },
    { id: "typewriter", name: "Typewriter", description: "Typing animation" },
    { id: "shake", name: "Shake", description: "Nervous vibration" },
];

interface ProfileStylePickerProps {
    font: string;
    effect: string;
    color: string;
    username: string;
    onFontChange: (font: string) => void;
    onEffectChange: (effect: string) => void;
    onColorChange: (color: string) => void;
}

export function ProfileStylePicker({
    font, effect, color, username,
    onFontChange, onEffectChange, onColorChange
}: ProfileStylePickerProps) {
    const [open, setOpen] = useState(false);

    const getFontFamily = (fontId: string) => FONTS.find(f => f.id === fontId)?.family || "inherit";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="w-full cursor-pointer bg-[#09090b] border border-zinc-800 rounded-xl h-[80px] flex items-center justify-between px-6 hover:border-zinc-700 transition-colors group">
                    {/* Left: Username Preview */}
                    <span
                        className={cn("text-2xl font-bold transition-all", `username-effect-${effect}`)}
                        style={{ color: color === "#ffffff" ? undefined : color, fontFamily: getFontFamily(font) }}
                    >
                        {username || "Username"}
                    </span>

                    {/* Right: Meta & Action */}
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-cyan-500 group-hover:text-cyan-400 uppercase tracking-widest transition-colors">CHANGE EFFECT</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{EFFECTS.find(e => e.id === effect)?.name || "NONE"}</span>
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-4xl bg-[#09090b] border-zinc-900 text-white max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Customize Appearance
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Make your username stand out across the platform.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="effects" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 shrink-0 border-b border-zinc-800">
                            <TabsList className="bg-transparent -mb-[1px] h-auto p-0 gap-6">
                                <TabsTrigger value="effects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent py-3 px-0 font-medium text-zinc-400 data-[state=active]:text-white transition-all">
                                    <Sparkles className="w-4 h-4 mr-2" /> Effects
                                </TabsTrigger>
                                <TabsTrigger value="fonts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent py-3 px-0 font-medium text-zinc-400 data-[state=active]:text-white transition-all">
                                    <Type className="w-4 h-4 mr-2" /> Fonts
                                </TabsTrigger>
                                <TabsTrigger value="colors" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent py-3 px-0 font-medium text-zinc-400 data-[state=active]:text-white transition-all">
                                    <Palette className="w-4 h-4 mr-2" /> Colors
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

                            {/* EFFECTS TAB */}
                            <TabsContent value="effects" className="mt-0 h-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                                    {EFFECTS.map((fx) => (
                                        <div
                                            key={fx.id}
                                            onClick={() => onEffectChange(fx.id)}
                                            className={cn(
                                                "cursor-pointer group relative p-6 rounded-xl border transition-all duration-300",
                                                effect === fx.id
                                                    ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/50"
                                                    : "bg-black/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className={cn(
                                                    "text-2xl font-bold",
                                                    `username-effect-${fx.id}`
                                                )}
                                                    style={{ color: color !== "#ffffff" ? color : undefined }}
                                                >
                                                    {username || "User"}
                                                </h3>
                                                {effect === fx.id && <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/70" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-zinc-300 mb-1">{fx.name}</div>
                                                <div className="text-xs text-zinc-500">{fx.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* FONTS TAB */}
                            <TabsContent value="fonts" className="mt-0 h-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
                                    {FONTS.map((f) => (
                                        <div
                                            key={f.id}
                                            onClick={() => onFontChange(f.id)}
                                            className={cn(
                                                "cursor-pointer p-6 rounded-xl border transition-all items-center flex justify-between",
                                                font === f.id
                                                    ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/50"
                                                    : "bg-black/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                                            )}
                                        >
                                            <span
                                                className="text-xl"
                                                style={{ fontFamily: f.family }}
                                            >
                                                {username || "Username"}
                                            </span>
                                            <span className="text-xs text-zinc-500 font-mono tracking-wider ml-4 uppercase opacity-60">
                                                {f.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* COLORS TAB */}
                            <TabsContent value="colors" className="mt-0 h-full">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-widest">Custom Color</h3>
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-zinc-900">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => onColorChange(e.target.value)}
                                                className="w-16 h-16 rounded cursor-pointer bg-transparent"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={color}
                                                    onChange={(e) => onColorChange(e.target.value)}
                                                    className="w-full bg-transparent border-none text-xl font-mono text-zinc-300 focus:ring-0"
                                                />
                                                <p className="text-xs text-zinc-500 mt-1">Hex color code (e.g. #FF0000)</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-widest">Preset Colors</h3>
                                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                                            {[
                                                "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
                                                "#00FFFF", "#FF00FF", "#FFA500", "#800080", "#008000",
                                                "#800000", "#000080", "#808000", "#800080", "#008080", "#C0C0C0"
                                            ].map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => onColorChange(c)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-lg border border-white/10 transition-transform hover:scale-110",
                                                        color.toLowerCase() === c.toLowerCase() && "ring-2 ring-white ring-offset-2 ring-offset-[#09090b]"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-900 bg-[#09090b] flex justify-between items-center shrink-0">
                            <div className="text-xs text-zinc-500">
                                Some effects may behave differently on different browsers.
                            </div>
                            <Button onClick={() => setOpen(false)} className="px-8 bg-white text-black hover:bg-zinc-200">
                                Done
                            </Button>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
