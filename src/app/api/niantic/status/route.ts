import { NextResponse } from "next/server";
import { isNianticSpatialEnabled } from "@/lib/niantic/config";

export async function GET() {
    return NextResponse.json({
        enabled: isNianticSpatialEnabled(),
    });
}
