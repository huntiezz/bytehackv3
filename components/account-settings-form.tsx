"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, Github as GithubIcon } from "lucide-react";
import Image from "next/image";
import { uploadFile } from "@/lib/upload-file";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const VALIDATION_RULES = {
  USERNAME: {
    MAX_LENGTH: 14,
    MIN_LENGTH: 1,
    PATTERN: /^[a-zA-Z0-9._-]+$/,
  },
  DISPLAY_NAME: {
    MAX_LENGTH: 14,
    PATTERN: /^[a-zA-Z0-9._\- ]+$/,
    MAX_SPACES: 1,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
};

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

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (error) {
      if (error === 'discord_denied') toast.error('Discord connection denied');
      else if (error === 'github_denied') toast.error('GitHub connection denied');
      else toast.error('Failed to connect account: ' + error);
    }

    if (success) {
      if (success === 'discord_linked') toast.success('Discord connected!');
      else if (success === 'github_linked') toast.success('GitHub connected!');

      // Clean URL
      router.replace('/account-settings');
    }
  }, [searchParams, router]);

  const handleUnlink = async (provider: 'discord' | 'github') => {
    if (!confirm(`Are you sure you want to disconnect ${provider === 'discord' ? 'Discord' : 'GitHub'}?`)) return;

    try {
      const res = await fetch('/api/auth/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });

      if (res.ok) {
        toast.success(`${provider === 'discord' ? 'Discord' : 'GitHub'} disconnected`);
        router.refresh();
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue.includes(' ')) {
      toast.error('Username cannot contain spaces');
      return;
    }

    if (newValue.length <= VALIDATION_RULES.USERNAME.MAX_LENGTH) {
      if (newValue === '' || VALIDATION_RULES.USERNAME.PATTERN.test(newValue)) {
        setUsername(newValue);
      } else {
        toast.error('Username can only contain letters, numbers, dots (.), underscores (_), or hyphens (-)');
      }
    } else {
      toast.error(`Username cannot exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`);
    }
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (/\s{2,}/.test(newValue)) {
      toast.error('No multiple spaces allowed');
      return;
    }

    const spaceCount = (newValue.match(/ /g) || []).length;
    if (spaceCount > VALIDATION_RULES.DISPLAY_NAME.MAX_SPACES) {
      toast.error(`Display name can have maximum ${VALIDATION_RULES.DISPLAY_NAME.MAX_SPACES} space`);
      return;
    }

    if (newValue.length <= VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH) {
      if (newValue === '' || VALIDATION_RULES.DISPLAY_NAME.PATTERN.test(newValue)) {
        setDisplayName(newValue);
      } else {
        toast.error('Display name can only contain letters, numbers, dots (.), underscores (_), hyphens (-), and spaces');
      }
    } else {
      toast.error(`Display name cannot exceed ${VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH} characters`);
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    if (newValue.length <= VALIDATION_RULES.BIO.MAX_LENGTH) {
      setBio(newValue);
    } else {
      toast.error(`Bio cannot exceed ${VALIDATION_RULES.BIO.MAX_LENGTH} characters`);
    }
  };

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

    if (username.trim().length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      toast.error(`Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`);
      return;
    }

    if (username.trim().length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
      toast.error(`Username cannot exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`);
      return;
    }

    if (displayName.trim().length > VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH) {
      toast.error(`Display name cannot exceed ${VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH} characters`);
      return;
    }

    if (bio.trim().length > VALIDATION_RULES.BIO.MAX_LENGTH) {
      toast.error(`Bio cannot exceed ${VALIDATION_RULES.BIO.MAX_LENGTH} characters`);
      return;
    }

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
          username: username.toLowerCase(),
          bio: bio,
          profile_picture: finalAvatarUrl,
          banner_image: finalBannerUrl,
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

      <div className="relative mb-24">

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


      <div className="space-y-8 max-w-3xl mx-auto lg:mx-0 lg:pl-4">

        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <label className="text-sm font-semibold text-zinc-400">Username</label>
            <span className={`text-xs ${username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH * 0.9
              ? 'text-red-500 font-semibold'
              : username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH * 0.75
                ? 'text-yellow-500'
                : 'text-zinc-500'
              }`}>
              {username.length}/{VALIDATION_RULES.USERNAME.MAX_LENGTH}
            </span>
          </div>
          <Input
            value={username}
            onChange={handleUsernameChange}
            className="h-14 bg-[#09090b] border-zinc-800 focus:border-zinc-700 text-lg rounded-xl px-5"
            placeholder="Your username"
            maxLength={VALIDATION_RULES.USERNAME.MAX_LENGTH}
          />
          <p className="text-xs text-zinc-500 ml-1">
            Letters, numbers, dots (.), underscores (_), hyphens (-) only. No spaces. You can change your username 2 times per 7 days.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <label className="text-sm font-semibold text-zinc-400">Display Name</label>
            <span className={`text-xs ${displayName.length > VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH * 0.9
              ? 'text-red-500 font-semibold'
              : displayName.length > VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH * 0.75
                ? 'text-yellow-500'
                : 'text-zinc-500'
              }`}>
              {displayName.length}/{VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH}
            </span>
          </div>
          <Input
            value={displayName}
            onChange={handleDisplayNameChange}
            className="h-14 bg-[#09090b] border-zinc-800 focus:border-zinc-700 text-lg rounded-xl px-5"
            placeholder="Your display name"
            maxLength={VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH}
          />
          <p className="text-xs text-zinc-500 ml-1">
            Letters, numbers, dots (.), underscores (_), hyphens (-), and max 1 space allowed.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between px-1">
            <label className="text-sm font-semibold text-zinc-400">Bio</label>
            <span className={`text-xs ${bio.length > VALIDATION_RULES.BIO.MAX_LENGTH * 0.9
              ? 'text-red-500 font-semibold'
              : bio.length > VALIDATION_RULES.BIO.MAX_LENGTH * 0.75
                ? 'text-yellow-500'
                : 'text-zinc-500'
              }`}>
              {bio.length}/{VALIDATION_RULES.BIO.MAX_LENGTH}
            </span>
          </div>
          <Textarea
            value={bio}
            onChange={handleBioChange}
            className="min-h-[140px] bg-[#09090b] border-zinc-800 focus:border-zinc-700 rounded-xl px-5 py-4 text-base resize-none"
            placeholder="Tell us about yourself..."
            maxLength={VALIDATION_RULES.BIO.MAX_LENGTH}
          />
        </div>

        <div className="pt-8 border-t border-zinc-900/50 space-y-6">
          <h3 className="text-lg font-semibold text-white ml-1">Connected Accounts</h3>

          {/* Discord Connection */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#09090b] border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">Discord</div>
                {user.discord_username ? (
                  <div className="text-sm text-zinc-400">Connected as <span className="text-zinc-200">{user.discord_username}</span></div>
                ) : (
                  <div className="text-sm text-zinc-500">Connect your Discord account</div>
                )}
              </div>
            </div>
            {user.discord_username ? (
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => handleUnlink('discord')}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => window.location.href = '/api/auth/link/discord'}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0"
              >
                Connect
              </Button>
            )}
          </div>

          {/* GitHub Connection */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#09090b] border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <GithubIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-medium text-white">GitHub</div>
                {user.github_username ? (
                  <div className="text-sm text-zinc-400">Connected as <span className="text-zinc-200">{user.github_username}</span></div>
                ) : (
                  <div className="text-sm text-zinc-500">Link your GitHub profile</div>
                )}
              </div>
            </div>
            {user.github_username ? (
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => handleUnlink('github')}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => window.location.href = '/api/auth/link/github'}
              >
                Connect
              </Button>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900/50 space-y-6">
          <h3 className="text-lg font-semibold text-white ml-1">Security</h3>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-400 ml-1">Email</label>
            <Input
              value={user.email}
              disabled
              className="h-14 bg-[#09090b] border-zinc-800 text-zinc-500 text-lg rounded-xl px-5"
            />
            <p className="text-xs text-zinc-500 ml-1">Email cannot be changed. Contact support if needed.</p>
          </div>

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
