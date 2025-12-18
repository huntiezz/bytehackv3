import { SignupForm } from "@/components/signup-form";

export default function RegisterPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 pb-60 bg-background">
            <div className="w-full max-w-sm">
                <SignupForm />
            </div>
        </div>
    );
}
