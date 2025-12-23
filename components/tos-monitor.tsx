"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export function TosMonitor() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const lastPathRef = useRef("");

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const isForumPost = pathname?.startsWith('/forum/') &&
            pathname !== '/forum' &&
            !pathname.includes('/search') &&
            pathname.split('/').length === 3;

        if (isForumPost && pathname !== lastPathRef.current) {
            const currentCount = parseInt(localStorage.getItem('tos_view_count') || '0');
            const newCount = currentCount + 1;
            console.log(`ToS Monitor: View count ${newCount} (Path: ${pathname})`);
            localStorage.setItem('tos_view_count', newCount.toString());


            if (newCount > 0 && newCount % 10 === 0) {
                setOpen(true);
            }

            lastPathRef.current = pathname;
        } else if (pathname && pathname !== lastPathRef.current) {

            lastPathRef.current = pathname;
        }
    }, [pathname]);

    const handleAgree = () => {
        setOpen(false);
        toast.success("Thank you for acknowledging.");
    };

    const handleDisconnect = async (e: React.MouseEvent) => {
        e.preventDefault();
        const supabase = createClient();
        await supabase.auth.signOut();
        localStorage.removeItem('tos_view_count');
        setOpen(false);
        router.push("/login");
        toast("Logged out.");
    };

    return (
        <AlertDialog open={open} onOpenChange={(val) => {

            if (!val && open) return;
            setOpen(val);
        }}>
            <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>TOS Re-acknowledgement</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have viewed 10 posts. To continue using the forum, please confirm that you still agree to our <Link href="/rules" className="text-primary hover:underline font-bold" target="_blank">Terms of Service and Rules</Link>.
                        <br /><br />
                        Declining will log you out immediately.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleDisconnect} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        No, log me out
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleAgree}>
                        Yes, I agree
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
