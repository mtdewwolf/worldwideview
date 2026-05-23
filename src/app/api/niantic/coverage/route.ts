import { NextResponse } from "next/server";
import { isNianticSpatialEnabled, useNianticFixtures } from "@/lib/niantic/config";
import {
    filterSitesByRadius,
    geoJsonToSiteEntities,
    loadFixtureCoverage,
    sitesToGeoJson,
} from "@/lib/niantic/coverage";
import { findSitesNear } from "@/lib/niantic/siteCache";

export const revalidate = 0;

export async function GET(request: Request) {
    if (!isNianticSpatialEnabled() && !useNianticFixtures()) {
        return NextResponse.json({ error: "Niantic Spatial is not enabled" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const lat = Number.parseFloat(searchParams.get("lat") ?? "");
    const lng = Number.parseFloat(searchParams.get("lng") ?? "");
    const radiusM = Number.parseFloat(searchParams.get("radiusM") ?? "500");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json(
            { error: "lat and lng query parameters are required" },
            { status: 400 },
        );
    }

    const radius = Number.isFinite(radiusM) && radiusM > 0 ? radiusM : 500;

    try {
        if (useNianticFixtures()) {
            const fixture = loadFixtureCoverage();
            const sites = geoJsonToSiteEntities(fixture);
            const filtered = filterSitesByRadius(sites, lat, lng, radius);
            return NextResponse.json(sitesToGeoJson(filtered));
        }

        const sites = await findSitesNear(lat, lng, radius);
        return NextResponse.json(sitesToGeoJson(sites));
    } catch (err) {
        console.error("[niantic/coverage]", err);
        return NextResponse.json({ error: "Coverage query failed" }, { status: 500 });
    }
}
