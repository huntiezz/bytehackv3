import { getCurrentUser } from "@/lib/auth";
import { ConditionalLayout } from "./conditional-layout";

export async function ConditionalLayoutWrapper() {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin" || user?.is_admin === true;
    const isOffsetUpdater = user?.role === "offset_updater" || isAdmin;

    return <ConditionalLayout user={user} isAdmin={isAdmin} isOffsetUpdater={isOffsetUpdater} />;
}
