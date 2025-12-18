import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";

export default async function ProductsPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Products</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {!products || products.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground col-span-full">
              No products available yet.
            </Card>
          ) : (
            products.map((product: any) => (
              <ProductCard 
                key={product.id} 
                product={product}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
