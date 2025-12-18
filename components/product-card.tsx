"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ShoppingCart, ThumbsUp, ThumbsDown } from "lucide-react";
import { CheckoutModal } from "@/components/checkout-modal";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: any;
  currentUser: any;
}

export function ProductCard({ product, currentUser }: ProductCardProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const router = useRouter();

  const isFree = product.price === "$0" || product.price === "Free" || product.price === "0";

  useEffect(() => {
    fetchVotes();
  }, [product.id]);

  const fetchVotes = async () => {
    try {
      const res = await fetch(`/api/products/${product.id}/vote`);
      const data = await res.json();
      if (data.likes !== undefined) {
        setLikes(data.likes);
        setDislikes(data.dislikes);
      }
    } catch (e) {

    }
  };

  const handleVote = async (value: number) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    if (value === 1) setLikes(prev => prev + 1);
    else setDislikes(prev => prev + 1);

    try {
      const res = await fetch(`/api/products/${product.id}/vote`, {
        method: "POST",
        body: JSON.stringify({ value })
      });
      if (!res.ok) throw new Error();
      toast.success("Thanks for voting!");
      fetchVotes();
    } catch (e) {
      toast.error("Failed to register vote");
      fetchVotes();
    }
  };

  const handleAction = () => {
    if (!currentUser) {
      toast.error("Please sign in to continue");
      router.push("/login");
      return;
    }

    if (isFree) {
      handleFreeDownload();
    } else {
      setShowCheckout(true);
    }
  };

  const handleFreeDownload = async () => {
    if (!product.deliverable_file_url) {
      toast.error("Download not available");
      return;
    }

    try {
      const filename = product.deliverable_file_url.split('/').pop();
      const response = await fetch(`/api/download/${filename}`);

      if (!response.ok) {
        toast.error("Download failed");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = product.title || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Download started!");


      setTimeout(() => {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span>Rate this tool?</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { handleVote(1); toast.dismiss(t.id); }}>
                <ThumbsUp className="w-4 h-4 mr-2" /> Like
              </Button>
              <Button size="sm" variant="outline" onClick={() => { handleVote(-1); toast.dismiss(t.id); }}>
                <ThumbsDown className="w-4 h-4 mr-2" /> Dislike
              </Button>
            </div>
          </div>
        ), { duration: 5000 });
      }, 2000);

    } catch (error) {
      toast.error("Download failed");
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-[#0a0a0a] border-white/5">
        <div className="relative aspect-video bg-black/5">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-contain p-4"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight text-white">{product.title}</h3>
            <Badge variant={product.status === "Available" ? "default" : "secondary"} className="text-xs flex-shrink-0">
              {product.status}
            </Badge>
          </div>

          {product.description && (
            <p className="text-sm text-zinc-400 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-zinc-500 text-xs mt-1">
            <button onClick={() => handleVote(1)} className="flex items-center gap-1 hover:text-green-400 transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
              {likes}
            </button>
            <button onClick={() => handleVote(-1)} className="flex items-center gap-1 hover:text-red-400 transition-colors">
              <ThumbsDown className="w-3.5 h-3.5" />
              {dislikes}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-2xl font-bold text-white">
              {isFree ? "Free" : product.price}
            </span>
            <Button
              size="sm"
              className="bg-white text-black hover:bg-zinc-200"
              disabled={product.status !== "Available"}
              onClick={handleAction}
            >
              {product.status !== "Available" ? (
                "Coming Soon"
              ) : isFree ? (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {showCheckout && !isFree && (
        <CheckoutModal
          product={product}
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
