"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export function BanCheckButton() {
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/check-ban/recheck", {
        method: "POST",
      });

      const data = await res.json();

      if (data.isBanned) {
        toast.error("You are still banned/blacklisted");
      } else {
        toast.success("Ban removed! Redirecting...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      toast.error("Failed to check status");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Button 
      variant="default" 
      onClick={checkStatus} 
      disabled={checking}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
      {checking ? "Checking..." : "Check Again"}
    </Button>
  );
}
