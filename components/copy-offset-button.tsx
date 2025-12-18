"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface CopyOffsetButtonProps {
  data: any;
}

export function CopyOffsetButton({ data }: CopyOffsetButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const cppFormat = Object.entries(data || {})
      .map(([key, value]) => `constexpr uintptr_t ${key} = ${value};`)
      .join('\n');
    
    navigator.clipboard.writeText(cppFormat);
    setCopied(true);
    toast.success("Copied to clipboard!");
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  );
}
