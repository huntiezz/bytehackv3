import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        if (!code) {
            return NextResponse.json({ success: false, error: "Missing captcha token" }, { status: 400 });
        }

        if (!secretKey) {
            console.error("RECAPTCHA_SECRET_KEY is not defined");
            return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
        }

        // Bypass for localhost
        if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_APP_URL?.includes("localhost")) {
            return NextResponse.json({ success: true });
        }

        // Google reCAPTCHA verification URL
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${code}`;

        const result = await fetch(verificationUrl, {
            method: 'POST',
        });

        const outcome = await result.json();

        if (outcome.success) {
            return NextResponse.json({ success: true });
        } else {
            console.error("reCAPTCHA validation failed:", outcome);
            return NextResponse.json({ success: false, error: "Invalid captcha" }, { status: 400 });
        }

    } catch (error) {
        console.error("Captcha API error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
