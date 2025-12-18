"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ShoppingCart } from "lucide-react";

interface CheckoutModalProps {
  product: any;
  open: boolean;
  onClose: () => void;
}

export function CheckoutModal({ product, open, onClose }: CheckoutModalProps) {
  const handleCheckout = () => {
    alert("Payment processing will be implemented here");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{product.title}</h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.description}
                  </p>
                )}
              </div>
              <Badge>{product.status}</Badge>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-xl font-bold">{product.price}</span>
            </div>
          </div>

          {product.deliverables && (
            <div className="bg-secondary/20 p-3 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">What you'll get:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.deliverables}
              </p>
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleCheckout}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Payment
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
