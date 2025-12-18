"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Download, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { uploadFile } from "@/lib/upload-file";

const statuses = ["Available", "Coming Soon", "Sold Out"];

interface ProductManagementCardProps {
  product: any;
}

export function ProductManagementCard({ product }: ProductManagementCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price);
  const [quantity, setQuantity] = useState(product.quantity || 0);
  const [deliverables, setDeliverables] = useState(product.deliverables || "");
  const [deliverableNote, setDeliverableNote] = useState(product.deliverable_note || "");
  const [status, setStatus] = useState(product.status);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  
  const router = useRouter();

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = product.image_url;
      let delivFileUrl = product.deliverable_file_url;

      if (productImage) {
        try {
          imageUrl = await uploadFile(productImage);
        } catch (error) {
          toast.error("Failed to upload product image");
          setLoading(false);
          return;
        }
      }

      if (deliverableFile) {
        try {
          delivFileUrl = await uploadFile(deliverableFile);
        } catch (error) {
          toast.error("Failed to upload deliverable file");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          quantity: parseInt(quantity.toString()) || 0,
          deliverables,
          deliverable_note: deliverableNote,
          deliverable_file_url: delivFileUrl,
          image_url: imageUrl,
          status,
        }),
      });

      if (res.ok) {
        toast.success("Product updated successfully!");
        setShowEdit(false);
        router.refresh();
      } else {
        toast.error("Failed to update product");
      }
    } catch (error) {
      toast.error("Error updating product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Product deleted successfully!");
        setShowDelete(false);
        router.refresh();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      toast.error("Error deleting product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          {product.image_url && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-primary">{product.price}</span>
                  <Badge variant={product.status === "Available" ? "default" : "secondary"}>
                    {product.status}
                  </Badge>
                </div>
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>Qty: {product.quantity || "∞"}</span>
              {product.deliverable_file_url && (
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  File attached
                </span>
              )}
              {product.image_url && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Image
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEdit(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Product Name</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Price</label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
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
              {product.image_url && !productImage && (
                <p className="text-xs text-muted-foreground mt-1">Current image will be kept if not replaced</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
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
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Deliverable File (Optional)</label>
              <Input
                type="file"
                onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)}
              />
              {product.deliverable_file_url && !deliverableFile && (
                <p className="text-xs text-muted-foreground mt-1">Current file will be kept if not replaced</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Deliverable Note (Optional)</label>
              <Textarea
                value={deliverableNote}
                onChange={(e) => setDeliverableNote(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{product.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
              <Button variant="outline" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
