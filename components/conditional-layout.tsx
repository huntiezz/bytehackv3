'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';


import { EmailVerificationModal } from './email-verification-modal';

export function ConditionalLayout({
    user,
    isAdmin,
    isOffsetUpdater
}: {
    user: any;
    isAdmin: boolean;
    isOffsetUpdater: boolean;
}) {
    const pathname = usePathname();

    return (
        <>

            <Navigation user={user} isAdmin={isAdmin} isOffsetUpdater={isOffsetUpdater} />
            {user && (
                <EmailVerificationModal
                    userEmail={user.email}
                    isVerified={user.email_verified}
                />
            )}
        </>
    );
}
