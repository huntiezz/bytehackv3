
import { SignJWT, jwtVerify } from "jose";

const CSRF_SECRET = new TextEncoder().encode(
    process.env.CSRF_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "default-secret-key-change-in-prod"
);

export async function createCsrfToken(sessionId: string) {
    return await new SignJWT({ sid: sessionId })
        .setProtectedHeader({ alg: "HS256" })
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(CSRF_SECRET);
}

export async function verifyCsrfToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, CSRF_SECRET);
        return payload;
    } catch (e) {
        return null;
    }
}
