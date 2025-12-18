import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code, secret } = await req.json();

        const supabase = await createClient();



        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const unverifiedFactor = factors.totp.find((f: any) => f.status === 'unverified');

        if (!unverifiedFactor) {
            return NextResponse.json({ error: "No pending setup found" }, { status: 400 });
        }

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: unverifiedFactor.id
        });

        if (challengeError) {
            return NextResponse.json({ error: challengeError.message }, { status: 400 });
        }

        const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
            factorId: unverifiedFactor.id,
            challengeId: challengeData.id,
            code: code
        });

        if (verifyError) {
            return NextResponse.json({ error: verifyError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("MFA Verify Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
