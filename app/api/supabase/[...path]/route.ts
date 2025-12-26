import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/security';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    return handleProxy(req);
}

export async function POST(req: NextRequest) {
    return handleProxy(req);
}

export async function PUT(req: NextRequest) {
    return handleProxy(req);
}

export async function PATCH(req: NextRequest) {
    return handleProxy(req);
}

export async function DELETE(req: NextRequest) {
    return handleProxy(req);
}

export async function HEAD(req: NextRequest) {
    return handleProxy(req);
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
            'Access-Control-Max-Age': '86400',
        }
    });
}

async function handleProxy(req: NextRequest) {
    // 0. RATE LIMITING
    const ip = getClientIp(req);
    if (!rateLimit(`proxy:${ip}`, 100, 60000)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. ORIGIN & SECURITY VERIFICATION
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${host}`;

    if (process.env.NODE_ENV === 'production') {
        const allowedHost = new URL(appUrl).host;

        // Verify Origin if present
        if (origin) {
            const originHost = new URL(origin).host;
            if (originHost !== allowedHost && !originHost.endsWith(`.${allowedHost}`)) {
                return NextResponse.json({ error: "Unauthorized Origin" }, { status: 403 });
            }
        }

        // Verify Referer if present
        if (referer) {
            const refererHost = new URL(referer).host;
            if (refererHost !== allowedHost && !refererHost.endsWith(`.${allowedHost}`)) {
                return NextResponse.json({ error: "Unauthorized Referer" }, { status: 403 });
            }
        }
    }

    // 2. CONSTRUCT UPSTREAM URL
    const path = req.nextUrl.pathname.replace('/api/supabase', '');

    // We strictly proxy to Supabase to prevent SSRF
    const url = new URL(path + req.nextUrl.search, supabaseUrl).toString();

    // 3. CLEAN & INJECT HEADERS
    const headers = new Headers();
    req.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        // Strip headers that should not be forwarded or are handled by the fetch agent
        if (![
            'host',
            'cookie',
            'connection',
            'upgrade',
            'accept-encoding',
            'content-length',
            'cf-connecting-ip',
            'cf-ray',
            'cf-visitor',
            'x-forwarded-for',
            'x-forwarded-proto',
            'x-real-ip'
        ].includes(k)) {
            headers.set(key, value);
        }
    });

    // Enforce the API Key on the server-side
    // This ensures that even if the client sends a wrong/dummy key, the proxy uses the correct one.
    headers.set('apikey', supabaseKey);
    if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${supabaseKey}`);
    }

    headers.set('host', new URL(supabaseUrl).host);

    try {
        const body = (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS')
            ? await req.arrayBuffer()
            : undefined;

        const res = await fetch(url, {
            method: req.method,
            headers: headers,
            body: body,
            cache: 'no-store',
            // @ts-ignore
            duplex: body ? 'half' : undefined,
        });

        // 4. CLEAN RESPONSE HEADERS
        const responseHeaders = new Headers();
        res.headers.forEach((value, key) => {
            const k = key.toLowerCase();

            if (k === 'set-cookie') {
                const cookies = res.headers.getSetCookie();
                cookies.forEach(cookie => {
                    // Make cookies more secure and strip Supabase domain
                    let cleanCookie = cookie.replace(/Domain=[^;]+;?/, '');
                    if (!cleanCookie.includes('Secure')) cleanCookie += '; Secure';
                    if (!cleanCookie.includes('HttpOnly')) cleanCookie += '; HttpOnly';
                    if (!cleanCookie.includes('SameSite')) cleanCookie += '; SameSite=Lax';
                    responseHeaders.append('Set-Cookie', cleanCookie);
                });
            } else if (![
                'content-encoding',
                'transfer-encoding',
                'access-control-allow-origin',
                'connection',
                'server',
                'x-powered-by'
            ].includes(k)) {
                responseHeaders.set(key, value);
            }
        });

        // Add our own security headers
        responseHeaders.set('X-Content-Type-Options', 'nosniff');
        responseHeaders.set('X-Frame-Options', 'DENY');

        return new NextResponse(res.body, {
            status: res.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Supabase Proxy Error:', error);
        return NextResponse.json({ error: 'Proxy communication failed' }, { status: 502 });
    }
}
