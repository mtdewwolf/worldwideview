import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthEnabled } from "@/core/edition";
import { getMeshUploadSecret, isNianticSpatialEnabled } from "@/lib/niantic/config";
import { writeMeshFile } from "@/lib/niantic/meshStorage";
import { setSiteMeshPath, upsertSites } from "@/lib/niantic/siteCache";
import type { NianticSiteTransform } from "@/lib/niantic/types";

function isUploadAuthorized(request: Request): boolean {
    const secret = getMeshUploadSecret();
    if (!secret) return false;
    return request.headers.get("x-wwv-niantic-upload-secret") === secret;
}

export async function POST(request: Request) {
    if (!isNianticSpatialEnabled()) {
        return NextResponse.json({ error: "Niantic Spatial is not enabled" }, { status: 503 });
    }

    const secretOk = isUploadAuthorized(request);
    if (!secretOk && isAuthEnabled) {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    } else if (!secretOk) {
        return NextResponse.json({ error: "Upload secret required" }, { status: 401 });
    }

    const form = await request.formData();
    const siteId = form.get("siteId");
    const file = form.get("file");

    if (typeof siteId !== "string" || !siteId.trim()) {
        return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    if (!(file instanceof Blob)) {
        return NextResponse.json({ error: "file GLB is required" }, { status: 400 });
    }

    const transformRaw = form.get("transform");
    let transform: NianticSiteTransform | undefined;
    if (typeof transformRaw === "string" && transformRaw) {
        try {
            transform = JSON.parse(transformRaw) as NianticSiteTransform;
        } catch {
            return NextResponse.json({ error: "Invalid transform JSON" }, { status: 400 });
        }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < 12) {
        return NextResponse.json({ error: "File too small to be GLB" }, { status: 400 });
    }

    const glbMagic = buffer.readUInt32LE(0);
    if (glbMagic !== 0x46546c67) {
        return NextResponse.json({ error: "Expected binary GLB" }, { status: 400 });
    }

    try {
        await writeMeshFile(siteId.trim(), buffer);
        const lat = transform?.lat ?? 0;
        const lng = transform?.lng ?? 0;
        await upsertSites([{
            siteId: siteId.trim(),
            name: siteId.trim(),
            lat,
            lng,
            hasMesh: true,
            alt: transform?.alt,
            headingDeg: transform?.headingDeg,
        }]);
        await setSiteMeshPath(siteId.trim());
        return NextResponse.json({ ok: true, siteId: siteId.trim() });
    } catch (err) {
        console.error("[niantic/mesh POST]", err);
        const message = err instanceof Error ? err.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
