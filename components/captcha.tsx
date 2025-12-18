"use client";

import { useRef, useState } from "react";
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

    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        return <div className="text-red-500 text-xs p-2 text-center">Missing Site Key</div>;
    }

    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[65px] py-2 gap-2">
            <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={handleChange}
                onErrored={handleError}
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
