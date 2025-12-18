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

    headers.set('host', new URL(supabaseUrl).host);

    headers.delete('x-forwarded-for');
    headers.delete('x-forwarded-host');
    headers.delete('x-forwarded-proto');

    try {
        const body = req.method !== 'GET' && req.method !== 'HEAD'
            ? await req.blob()
            : undefined;

        const res = await fetch(url, {
            method: req.method,
            headers: headers,
            body: body,
            cache: 'no-store',
            // @ts-ignore - duplex is required for streaming body in fetch but not recognized by all types
            duplex: body ? 'half' : undefined,
        });

        const responseHeaders = new Headers(res.headers);

        responseHeaders.delete('access-control-allow-origin');

        return new NextResponse(res.body, {
            status: res.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Supabase Proxy Error:', error);
        return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
    }
}
