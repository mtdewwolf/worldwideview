import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthEnabled } from "@/core/edition";
import { isNianticSpatialEnabled } from "@/lib/niantic/config";
import { getSpatialAccessToken } from "@/lib/niantic/spatialIdentity";

export async function GET() {
    if (!isNianticSpatialEnabled()) {
        return NextResponse.json({ error: "Niantic Spatial is not enabled" }, { status: 503 });
    }

    if (isAuthEnabled) {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const token = await getSpatialAccessToken();
        return NextResponse.json({
            accessToken: token.accessToken,
            expiresAt: token.expiresAt,
        });
    } catch (err) {
        console.error("[niantic/token]", err);
        return NextResponse.json(
            { error: "Failed to obtain Niantic access token" },
            { status: 502 },
        );
    }
}
