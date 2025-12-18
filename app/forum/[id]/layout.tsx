import { ToastNavigation } from "@/components/toast-navigation";
import { ToastProvider } from "@/components/toast-provider";

export default async function PostLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const isCategoryPage = ['general-discussion', 'coding-discussion', 'cheat-discussion'].includes(id);

    if (isCategoryPage) {
        return (
            <>
                <ToastProvider />
                <main>{children}</main>
            </>
        );
    }

    return (
        <>
            <ToastProvider />
            <main>{children}</main>
        </>
    );
}
