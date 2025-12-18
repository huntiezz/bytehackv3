"use client";

import { useState } from "react";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { uploadFile } from "@/lib/upload-file";

const statuses = ["Available", "Coming Soon", "Sold Out"];

export function ProductForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [deliverableNote, setDeliverableNote] = useState("");
  const [status, setStatus] = useState("Available");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;
      let delivFileUrl = null;

      if (productImage) {
        try {
          const { publicUrl } = await uploadFile(productImage);
          imageUrl = publicUrl;
        } catch (error) {
          toast.error("Failed to upload product image");
          setLoading(false);
          return;
        }
      }

      if (deliverableFile) {
        try {
          const { publicUrl } = await uploadFile(deliverableFile);
          delivFileUrl = publicUrl;
        } catch (error) {
          toast.error("Failed to upload deliverable file");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          quantity: parseInt(quantity) || 0,
          deliverables,
          deliverable_note: deliverableNote,
          deliverable_file_url: delivFileUrl,
          image_url: imageUrl,
          status,
        }),
      });

      if (res.ok) {
        toast.success("Product created successfully!");
        setOpen(false);
        setTitle("");
        setDescription("");
        setPrice("");
        setQuantity("");
        setDeliverables("");
        setDeliverableNote("");
        setStatus("Available");
        setProductImage(null);
        setDeliverableFile(null);
        router.refresh();
      } else {
        toast.error("Failed to create product");
      }
    } catch (error) {
      toast.error("Error creating product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Product Name</label>
              <Input
                placeholder="e.g., Apex Legends Cheat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Price</label>
              <Input
                placeholder="$29.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              placeholder="Product description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Product Image (Optional)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setProductImage(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload a product image/thumbnail
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <Input
                type="number"
                placeholder="0 for unlimited"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex gap-2">
                {statuses.map((s) => (
                  <Badge
                    key={s}
                    variant={status === s ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setStatus(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Deliverables</label>
            <Textarea
              placeholder="What the customer receives (download link, license key, etc.)"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Upload Deliverable File (Optional)</label>
            <Input
              type="file"
              onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload the actual product file (software, cheat, etc.)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Deliverable Note (Optional)</label>
            <Textarea
              placeholder="Installation instructions, license info, or important notes for the buyer..."
              value={deliverableNote}
              onChange={(e) => setDeliverableNote(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
