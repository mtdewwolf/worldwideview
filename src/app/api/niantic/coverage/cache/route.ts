import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthEnabled } from "@/core/edition";
import { getMeshUploadSecret, isNianticSpatialEnabled } from "@/lib/niantic/config";
import { geoJsonToSiteEntities } from "@/lib/niantic/coverage";
import type { NianticCoverageGeoJson } from "@/lib/niantic/types";
import { upsertSites } from "@/lib/niantic/siteCache";

async function isAuthorized(request: Request): Promise<boolean> {
    const secret = getMeshUploadSecret();
    if (secret && request.headers.get("x-wwv-niantic-upload-secret") === secret) {
        return true;
    }
    if (!isAuthEnabled) return true;
    const session = await auth();
    return !!session?.user;
}

/** Ingest coverage GeoJSON from Unity export or admin tools. */
export async function POST(request: Request) {
    if (!isNianticSpatialEnabled()) {
        return NextResponse.json({ error: "Niantic Spatial is not enabled" }, { status: 503 });
    }

    if (!(await isAuthorized(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: NianticCoverageGeoJson;
    try {
        body = (await request.json()) as NianticCoverageGeoJson;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.type !== "FeatureCollection" || !Array.isArray(body.features)) {
        return NextResponse.json({ error: "Expected FeatureCollection" }, { status: 400 });
    }

    const sites = geoJsonToSiteEntities(body);
    await upsertSites(sites);

    return NextResponse.json({ ok: true, count: sites.length });
}
