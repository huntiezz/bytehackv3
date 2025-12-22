import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const user = await getCurrentUser();

    if (user) {
        redirect("/forum");
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 pb-60 bg-background">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    );
}
