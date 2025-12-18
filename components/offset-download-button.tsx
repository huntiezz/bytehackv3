"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

interface OffsetDownloadButtonProps {
  url: string;
  label: string;
  variant?: "default" | "secondary";
}

export function OffsetDownloadButton({ url, label, variant = "default" }: OffsetDownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const filename = url.split('/').pop();
      
      const response = await fetch(`/api/download/${filename}`);
      
      if (!response.ok) {
        toast.error("Download failed");
        return;
      }

      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast.success("Download started!");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  return (
    <Button variant={variant} size="sm" onClick={handleDownload} className="w-full justify-start text-xs">
      <Download className="h-3.5 w-3.5 mr-2" />
      {label}
    </Button>
  );
}
