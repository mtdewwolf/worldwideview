import { NextResponse } from "next/server";
import { isNianticSpatialEnabled } from "@/lib/niantic/config";
import { readMeshFile } from "@/lib/niantic/meshStorage";

export async function GET(
    _request: Request,
    context: { params: Promise<{ siteId: string }> },
) {
    if (!isNianticSpatialEnabled()) {
        return NextResponse.json({ error: "Niantic Spatial is not enabled" }, { status: 503 });
    }

    const { siteId } = await context.params;
    const decoded = decodeURIComponent(siteId);
    const buffer = readMeshFile(decoded);

    if (!buffer) {
        return NextResponse.json({ error: "Mesh not found" }, { status: 404 });
    }

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "model/gltf-binary",
            "Cache-Control": "private, max-age=3600",
        },
    });
}
