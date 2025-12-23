"use client";

import { useRef, useState, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface CaptchaProps {
    onVerify: (token: string) => void;
}

export function Captcha({ onVerify }: CaptchaProps) {
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (token: string | null) => {
        if (token) {
            onVerify(token);
            setError(null);
        } else {
            setError("Please complete the captcha.");
        }
    };

    const handleError = () => {
        console.error("ReCAPTCHA error");
        setError("Security check failed. Please refresh or check configuration.");
    };

    const handleExpired = () => {
        onVerify("");
        setError("Captcha expired. Please verify again.");
    };

    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        return <div className="text-red-500 text-xs p-2 text-center">Missing Site Key</div>;
    }

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hostname === "localhost") {
            onVerify("localhost-bypass-token");
        }
    }, [onVerify]);

    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        return <div className="text-xs text-green-500 text-center p-4 bg-green-500/10 rounded border border-green-500/20">Captcha bypassed (Localhost)</div>;
    }

    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[65px] py-2 gap-2">
            <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={handleChange}
                onErrored={handleError}
                onExpired={handleExpired}
                theme="dark"
            />
            {error && (
                <div className="text-red-500 text-xs text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
