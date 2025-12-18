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

async function handleProxy(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const path = req.nextUrl.pathname.replace('/api/supabase', '');
    const url = `${supabaseUrl}${path}${req.nextUrl.search}`;

    const headers = new Headers(req.headers);

    // Set the host to match the target
    headers.set('host', new URL(supabaseUrl).host);

    // Keep the forwarded headers if they exist, or set them
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        headers.set('x-forwarded-for', forwardedFor);
    }

    try {
        const body = req.method !== 'GET' && req.method !== 'HEAD'
            ? await req.arrayBuffer()
            : undefined;

        // When sending a body with fetch, the content-length will be set automatically
        // Deleting it from the cloned headers avoids conflicts
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
            if (key.toLowerCase() === 'set-cookie') {
                const cookies = res.headers.getSetCookie();
                cookies.forEach(cookie => {
                    const cleanCookie = cookie.replace(/Domain=[^;]+;?/, '');
                    responseHeaders.append('Set-Cookie', cleanCookie);
                });
            } else if (key.toLowerCase() !== 'access-control-allow-origin' && key.toLowerCase() !== 'content-encoding') {
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
