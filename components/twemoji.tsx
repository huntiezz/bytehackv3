'use client';

import React, { useEffect, useRef } from 'react';
import twemoji from 'twemoji';

interface TwemojiProps {
    text?: string;
    children?: React.ReactNode;
    className?: string;
    options?: any;
}

export function Twemoji({ text, children, className, options }: TwemojiProps) {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (rootRef.current) {
            twemoji.parse(rootRef.current, {
                folder: 'svg',
                ext: '.svg',
                ...options
            });
        }
    }, [text, children, options]);

    return (
        <span ref={rootRef} className={className}>
            {text}{children}
        </span>
    );
}

// Utility to replace text with twemoji images string (if needed for dangerousHtml)
export function parseTwemoji(text: string) {
    return twemoji.parse(text, {
        folder: 'svg',
        ext: '.svg'
    });
}
