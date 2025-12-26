"use client";

import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ZoomImageProps {
    src: string;
    alt?: string;
    className?: string;
    [key: string]: any;
}

export function ZoomImage({ src, alt, className, ...props }: ZoomImageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [lastTap, setLastTap] = useState(0);

    const handleTouchStart = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            setIsOpen(true);
        }

        setLastTap(now);
    };

    return (
        <>
            <img
                src={src}
                alt={alt}
                className={`${className} cursor-pointer active:scale-[0.98] transition-transform`}
                onTouchStart={handleTouchStart}
                onDoubleClick={() => setIsOpen(true)}
                {...props}
            />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[95vw] w-full h-auto max-h-[90vh] p-0 border-none bg-transparent overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={src}
                            alt={alt}
                            className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
