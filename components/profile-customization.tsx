"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Video, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/app/actions/upload";

interface ProfileCustomizationProps {
    userId: string;
    currentProfile: {
        profile_picture?: string;
        banner_image?: string;
        background_media?: string;
        background_type?: string;
        bio?: string;
        display_name?: string;
    };
}

export function ProfileCustomization({ userId, currentProfile }: ProfileCustomizationProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        profile_picture: currentProfile.profile_picture || "",
        banner_image: currentProfile.banner_image || "",
        background_media: currentProfile.background_media || "",
        background_type: currentProfile.background_type || "none",
        bio: currentProfile.bio || "",
        display_name: currentProfile.display_name || "",
    });

    const handleFileUpload = async (file: File, field: string) => {
        setUploading(field);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadFile(formData);

            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.url) {
                throw new Error("No URL returned from upload");
            }

            setFormData(prev => ({ ...prev, [field]: result.url }));
            toast.success("File uploaded successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to upload file");
            console.error(error);
        } finally {
            setUploading(null);
        }
    };


    const handleSave = async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/profile/customize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to save");
            }

            toast.success("Profile updated successfully!");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-6">
                    {/* Profile Picture */}
                    <Card className="p-6">
                        <Label className="text-base font-semibold mb-4 block">Profile Picture</Label>
                        <div className="flex items-center gap-4">
                            {formData.profile_picture && (
                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-accent">
                                    <img
                                        src={formData.profile_picture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="https://example.com/avatar.png"
                                    value={formData.profile_picture ?? ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, profile_picture: e.target.value }))}
                                />
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file, "profile_picture");
                                    }}
                                    disabled={uploading === "profile_picture"}
                                    className="mb-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Recommended: Square image, at least 256x256px
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Banner Image */}
                    <Card className="p-6">
                        <Label className="text-base font-semibold mb-4 block">Banner Image</Label>
                        <div className="space-y-4">
                            {formData.banner_image && (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-accent">
                                    <img
                                        src={formData.banner_image}
                                        alt="Banner"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, "banner_image");
                                }}
                                disabled={uploading === "banner_image"}
                            />
                            <p className="text-xs text-muted-foreground">
                                Recommended: 1500x500px or similar aspect ratio
                            </p>
                        </div>
                    </Card>

                    {/* Background Media */}
                    <Card className="p-6">
                        <Label className="text-base font-semibold mb-4 block">Background Media</Label>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.background_type === "image" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, background_type: "image" }))}
                                >
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                    Image
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.background_type === "video" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, background_type: "video" }))}
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Video
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.background_type === "none" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, background_type: "none", background_media: "" }))}
                                >
                                    None
                                </Button>
                            </div>

                            {formData.background_type !== "none" && (
                                <>
                                    {formData.background_media && (
                                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-accent">
                                            {formData.background_type === "video" ? (
                                                <video
                                                    src={formData.background_media}
                                                    className="w-full h-full object-cover"
                                                    autoPlay
                                                    loop
                                                    muted
                                                />
                                            ) : (
                                                <img
                                                    src={formData.background_media}
                                                    alt="Background"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    )}
                                    {/* Manual URL Input */}
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            placeholder={formData.background_type === "video" ? "https://example.com/video.mp4" : "https://example.com/image.png"}
                                            value={formData.background_media ?? ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, background_media: e.target.value }))}
                                            className="flex-1"
                                        />
                                    </div>

                                    <Input
                                        type="file"
                                        accept={formData.background_type === "video" ? "video/*" : "image/*"}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file, "background_media");
                                        }}
                                        disabled={uploading === "background_media"}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {formData.background_type === "video"
                                            ? "Recommended: MP4 format, max 50MB, keep it short for best performance"
                                            : "Recommended: High resolution image, will be used as page background"}
                                    </p>
                                </>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="info" className="space-y-6">
                    {/* Display Name */}
                    <Card className="p-6">
                        <Label htmlFor="display_name" className="text-base font-semibold mb-4 block">
                            Display Name
                        </Label>
                        <Input
                            id="display_name"
                            value={formData.display_name ?? ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                            placeholder="Your display name"
                            maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            This is how your name will appear on your profile
                        </p>
                    </Card>

                    {/* Bio */}
                    <Card className="p-6">
                        <Label htmlFor="bio" className="text-base font-semibold mb-4 block">
                            Bio
                        </Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell us about yourself..."
                            rows={5}
                            maxLength={500}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {formData.bio.length}/500 characters
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading || uploading !== null} size="lg">
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
