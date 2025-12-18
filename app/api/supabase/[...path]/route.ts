import { NextRequest, NextResponse } from 'next/server';

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const path = req.nextUrl.pathname.replace('/api/supabase', '');
    const url = `${supabaseUrl}${path}${req.nextUrl.search}`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (!['host', 'cookie', 'connection', 'upgrade', 'accept-encoding'].includes(k)) {
            headers.set(key, value);
        }
    });

    headers.set('host', new URL(supabaseUrl).host);

    try {
        const body = (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS')
            ? await req.arrayBuffer()
            : undefined;

        headers.delete('content-length');

        const res = await fetch(url, {
            method: req.method,
            headers: headers,
            body: body,
            cache: 'no-store',
            // @ts-ignore
            duplex: body ? 'half' : undefined,
        });

        const responseHeaders = new Headers();
        res.headers.forEach((value, key) => {
            const k = key.toLowerCase();
            if (k === 'set-cookie') {
                const cookies = res.headers.getSetCookie();
                cookies.forEach(cookie => {
                    const cleanCookie = cookie.replace(/Domain=[^;]+;?/, '');
                    responseHeaders.append('Set-Cookie', cleanCookie);
                });
            } else if (!['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'connection'].includes(k)) {
                responseHeaders.set(key, value);
            }
        });

        return new NextResponse(res.body, {
            status: res.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Supabase Proxy Error:', error);
        return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
    }
}
