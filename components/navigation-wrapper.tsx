import { Navigation } from "@/components/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function NavigationWrapper() {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";
    const isOffsetUpdater = user?.role === "offset_updater" || isAdmin;

    return <Navigation user={user} isAdmin={isAdmin} isOffsetUpdater={isOffsetUpdater} />;
}
