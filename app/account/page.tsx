import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountSettingsForm } from "@/components/account-settings-form";

export const revalidate = 0;

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <AccountSettingsForm user={user} />
      </div>
    </div>
  );
}
