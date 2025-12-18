import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Folder, FileText, ShoppingBag, ArrowRight } from "lucide-react";

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {


    const { q } = await searchParams;

    if (!q) {
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Search Forum</h1>
                <p className="text-muted-foreground">Type something in the search bar to get started.</p>
            </div>
        );
    }

    const supabase = await createClient();
    const query = `%${q}%`;

    const [categoriesData, productsData, postsData] = await Promise.all([
        supabase.from("categories").select("*").ilike("name", query).limit(5),
        supabase.from("products").select("*").ilike("name", query).limit(5),
        supabase.from("posts").select("*, users(*)").ilike("title", query).limit(10)

    ]);

    const categories = categoriesData.data || [];
    const products = productsData.data || [];
    const posts = postsData.data || [];

    const hasResults = categories.length > 0 || products.length > 0 || posts.length > 0;

    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">
                Search results for <span className="text-primary">"{q}"</span>
            </h1>

            {!hasResults && (
                <div className="text-muted-foreground p-8 border border-dashed rounded-lg text-center">
                    No results found. Try a different keyword.
                </div>
            )}

            <div className="space-y-8">
                {/* Categories */}
                {categories.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Folder className="h-5 w-5 text-primary" />
                            Categories
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {categories.map((cat: any) => (
                                <Link key={cat.id} href={`/forum/${cat.slug || cat.id}`}>
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-lg">{cat.name}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Products */}
                {products.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                            Products / Games
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {products.map((prod: any) => (
                                <Link key={prod.id} href={`/products`}>
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-lg">{prod.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {prod.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Posts */}
                {posts.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Forum Posts
                        </h2>
                        <div className="grid gap-3">
                            {posts.map((post: any) => (
                                <Link key={post.id} href={`/forum/post/${post.id}`}>
                                    <Card className="hover:bg-white/5 transition-colors cursor-pointer border-transparent bg-secondary/20">
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    by {(post.users?.username || 'Unknown').length > 15 ? (post.users?.username || 'Unknown').substring(0, 15) + "..." : (post.users?.username || 'Unknown')}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
