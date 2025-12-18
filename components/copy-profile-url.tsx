"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface CopyProfileUrlProps {
  username: string;
}

export function CopyProfileUrl({ username }: CopyProfileUrlProps) {
  const [copied, setCopied] = useState(false);
  
  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/user/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile URL copied to clipboard!");
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  if (!username) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Your Profile URL</label>
      <div className="flex gap-2">
        <Input
          value={profileUrl}
          readOnly
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex-shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
        <Link href={`/user/${username}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
