import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: user.email,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const qrCodeDataUrl = await QRCode.toDataURL(data.totp.uri);

        return NextResponse.json({
            id: data.id,
            type: data.type,
            qr: qrCodeDataUrl,
            secret: data.totp.secret
        });

    } catch (error) {
        console.error("MFA Enroll Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
