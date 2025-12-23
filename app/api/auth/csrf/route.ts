
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { createCsrfToken } from "@/lib/csrf";

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();

    // We can use an existing session ID if available, or generate a new random temporary ID
    let sessionId = cookieStore.get("csrf_sid")?.value;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
    }

    const token = await createCsrfToken(sessionId);

    // Set the session context in a cookie (httpOnly)
    // The token itself is returned to the client to be sent in headers
    cookieStore.set("csrf_sid", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600 // 1 hour
    });

    // Artificial delay as requested for "most secure" feel (blocking timing attacks?)
    // "double the amount of requests, u can add a slight delay to apis that use csrf tokens"
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200));

    return NextResponse.json({ token });
}
