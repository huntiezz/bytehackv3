import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/security';

export const runtime = 'edge';

// Helper to handle the proxy logic
async function handleProxy(req: NextRequest, params: { path: string[] }) {
    // 0. RATE LIMITING
    const ip = getClientIp(req);
    if (!rateLimit(`proxy:${ip}`, 100, 60000)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '');
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseKey = supabaseAnonKey;

    // 1. ORIGIN & SECURITY VERIFICATION
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : '');

    if (process.env.NODE_ENV === 'production' && appUrl) {
        try {
            const allowedHost = new URL(appUrl).host;
            if (origin && new URL(origin).host !== allowedHost && !new URL(origin).host.endsWith(`.${allowedHost}`)) {
                return NextResponse.json({ error: "Unauthorized Origin" }, { status: 403 });
            }
            if (referer && new URL(referer).host !== allowedHost && !new URL(referer).host.endsWith(`.${allowedHost}`)) {
                return NextResponse.json({ error: "Unauthorized Referer" }, { status: 403 });
            }
        } catch (e) { /* ignore */ }
    }

    // 2. CONSTRUCT UPSTREAM URL using PARAMS (Robust)
    // params.path is an array like ['rest', 'v1', 'code_matches']
    const pathSegments = params.path || [];
    const path = '/' + pathSegments.join('/');

    // Reconstruct query parameters, stripping 'apikey'
    const searchParams = new URLSearchParams(req.nextUrl.search);
    searchParams.delete('apikey');
    const search = searchParams.toString();

    // Final upstream URL using PARAMS
    const url = `${supabaseUrl}${path}${search ? '?' + search : ''}`;

    console.log(`[Proxy] Forwarding to: ${url}`);

    // 3. CLEAN & INJECT HEADERS
    const headers = new Headers();
    req.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (![
            'host', 'cookie', 'connection', 'upgrade', 'accept-encoding', 'content-length',
            'cf-connecting-ip', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip'
        ].includes(k)) {
            headers.set(key, value);
        }
    });

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
                    let cleanCookie = cookie.replace(/Domain=[^;]+;?/, '');
                    if (!cleanCookie.includes('Secure')) cleanCookie += '; Secure';
                    if (!cleanCookie.includes('HttpOnly')) cleanCookie += '; HttpOnly';
                    if (!cleanCookie.includes('SameSite')) cleanCookie += '; SameSite=Lax';
                    responseHeaders.append('Set-Cookie', cleanCookie);
                });
            } else if (!['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'connection', 'server', 'x-powered-by'].includes(k)) {
                responseHeaders.set(key, value);
            }
        });

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

// Route Handlers
export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function HEAD(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
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
