import { Navigation } from "@/components/navigation";

export function NavigationWrapper({
    user,
    isAdmin,
    isOffsetUpdater
}: {
    user: any;
    isAdmin: boolean;
    isOffsetUpdater: boolean;
}) {
    return <Navigation user={user} isAdmin={isAdmin} isOffsetUpdater={isOffsetUpdater} />;
}
