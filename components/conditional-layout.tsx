'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import Image from 'next/image';

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
            <div className="w-full bg-black">
                <Image
                    src="/bytehack_website_banner.png"
                    alt="ByteHack Banner"
                    width={1920}
                    height={300}
                    priority
                    className="w-full h-auto object-cover"
                />
            </div>
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
