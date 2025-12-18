"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { uploadFile } from "@/lib/upload-file";
import { ProfileStylePicker } from "@/components/profile-style-picker";

interface AccountSettingsFormProps {
  user: any;
}

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [displayName, setDisplayName] = useState(user.display_name || user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");

  const getInitialAvatar = () => {
    if (user.profile_picture) return user.profile_picture;
    if (user.avatar_url) return user.avatar_url;
    if (user.discord_avatar && user.discord_id) {
      return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png`;
    }
    return null;
  };

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(getInitialAvatar());

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.banner_image || user.banner_url || null);

  const [fontStyle, setFontStyle] = useState(user.font_style || "default");
  const [nameColor, setNameColor] = useState(user.name_color || "#ffffff");
  const [nameEffect, setNameEffect] = useState(user.name_effect || "none");
  const [profileDecoration, setProfileDecoration] = useState(user.profile_decoration || "");

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const userLevel = user.level || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'avatar') {
          setProfilePicture(file);
          setPreviewUrl(reader.result as string);
        } else {
          setBannerFile(file);
          setBannerPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalAvatarUrl = user.profile_picture;
      let finalBannerUrl = user.banner_image;

      if (profilePicture) {
        try {
          const { publicUrl } = await uploadFile(profilePicture);
          finalAvatarUrl = publicUrl;
        } catch (error) {
          toast.error("Failed to upload avatar");
          return;
        }
      }

      if (bannerFile) {
        try {
          const { publicUrl } = await uploadFile(bannerFile);
          finalBannerUrl = publicUrl;
        } catch (error) {
          toast.error("Failed to upload banner");
          return;
        }
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          username: username.toLowerCase().replace(/\s+/g, '_'),
          bio: bio,
          profile_picture: finalAvatarUrl,
          banner_image: finalBannerUrl,
          font_style: userLevel >= 1 ? fontStyle : undefined,
          name_color: userLevel >= 1 ? nameColor : undefined,
          name_effect: userLevel >= 1 ? nameEffect : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated!");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">

      {/* Visual Header Section */}
      <div className="relative mb-24">

        {/* Banner */}
        <div className="group relative w-full h-[280px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {bannerPreview ? (
            <Image src={bannerPreview} alt="Banner" fill className="object-cover transition-opacity group-hover:opacity-50" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white font-bold tracking-widest text-sm uppercase bg-black/50 px-4 py-2 rounded backdrop-blur">Edit Banner</span>
          </div>

          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={(e) => handleFileChange(e, 'banner')}
          />
        </div>

        {/* Avatar - Overlapping */}
        <div className="absolute -bottom-16 left-10">
          <div className="group relative w-[136px] h-[136px] rounded-full ring-[6px] ring-black bg-zinc-800 overflow-hidden">
            {previewUrl ? (
              <Image src={previewUrl} alt="Avatar" fill className="object-cover transition-opacity group-hover:opacity-50" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/20">
                {(displayName || username)?.[0]?.toUpperCase()}
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-bold tracking-widest text-[10px] uppercase text-center leading-tight">Edit<br />Avatar</span>
            </div>

            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={(e) => handleFileChange(e, 'avatar')}
            />
          </div>
        </div>
      </div>


      {/* Main Fields Container */}
      <div className="space-y-8 max-w-3xl mx-auto lg:mx-0 lg:pl-4">

        {/* Username */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-400 ml-1">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-14 bg-[#09090b] border-zinc-800 focus:border-zinc-700 text-lg rounded-xl px-5"
            placeholder="Your username"
          />
          <p className="text-xs text-zinc-500 ml-1">You can change your username 2 times per 7 days.</p>
        </div>

        {/* Display Name */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-400 ml-1">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-14 bg-[#09090b] border-zinc-800 focus:border-zinc-700 text-lg rounded-xl px-5"
            placeholder="Your display name"
          />
        </div>

        {/* Username Effect */}
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <label className="text-sm font-semibold text-zinc-400">Username effect</label>
          </div>

          {/* Custom Trigger UI */}
          <ProfileStylePicker
            font={fontStyle}
            effect={nameEffect}
            color={nameColor}
            username={displayName || username || "User"}
            onFontChange={setFontStyle}
            onEffectChange={setNameEffect}
            onColorChange={setNameColor}
          />

          {/* We are replacing the DialogTrigger inside ProfileStylePicker with this layout? 
                      Wait, ProfileStylePicker IS the UI component. I need to make sure IT renders the box. 
                      Ah, I implemented `ProfileStylePicker` to render the trigger box itself in the previous step.
                      So I just place it here. PERFECT.
                  */}
        </div>

        {/* Profile Decoration */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-400 ml-1">Profile Decoration</label>
          <Input
            placeholder="e.g., 👑 Elite Member, ⭐ Veteran"
            value={profileDecoration}
            onChange={(e) => setProfileDecoration(e.target.value)}
            className="h-14 bg-[#09090b] border-zinc-800 focus:border-zinc-700 text-lg rounded-xl px-5"
            maxLength={50}
          />
          <p className="text-xs text-zinc-500 ml-1">Custom badge text that appears on your profile</p>
        </div>

        {/* Email */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-400 ml-1">Email</label>
          <Input
            value={user.email}
            disabled
            className="h-14 bg-[#09090b] border-zinc-800 text-zinc-500 text-lg rounded-xl px-5"
          />
          <p className="text-xs text-zinc-500 ml-1">Email cannot be changed. Contact support if needed.</p>
        </div>

        {/* Bio */}
        <div className="space-y-3">
          <div className="flex justify-between px-1">
            <label className="text-sm font-semibold text-zinc-400">Bio</label>
            <span className="text-xs text-zinc-500">{bio.length}/500</span>
          </div>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[140px] bg-[#09090b] border-zinc-800 focus:border-zinc-700 rounded-xl px-5 py-4 text-base resize-none"
            placeholder="Tell use about yourself..."
          />
        </div>

        {/* Security / Password placeholder (assuming separate flow or modal, but UI shown in ref) */}
        <div className="pt-8 border-t border-zinc-900/50 space-y-6">
          <h3 className="text-lg font-semibold text-white ml-1">Security</h3>
          <Input placeholder="Enter current password" type="password" className="h-14 bg-[#09090b] border-zinc-800 rounded-xl px-5" />
          <Input placeholder="Enter new password" type="password" className="h-14 bg-[#09090b] border-zinc-800 rounded-xl px-5" />
          <Input placeholder="Confirm new password" type="password" className="h-14 bg-[#09090b] border-zinc-800 rounded-xl px-5" />

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="h-12 px-8 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "UPDATE PROFILE"}
            </Button>
          </div>
        </div>

      </div>
    </form>
  );
}
