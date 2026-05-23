import { NextResponse } from "next/server";
import { isNianticSpatialEnabled, useNianticFixtures } from "@/lib/niantic/config";
import { geoJsonToSiteEntities, loadFixtureCoverage } from "@/lib/niantic/coverage";
import { getSiteById } from "@/lib/niantic/siteCache";

export async function GET(
    _request: Request,
    context: { params: Promise<{ siteId: string }> },
) {
    if (!isNianticSpatialEnabled() && !useNianticFixtures()) {
        return NextResponse.json({ error: "Niantic Spatial is not enabled" }, { status: 503 });
    }

    const { siteId } = await context.params;
    const decoded = decodeURIComponent(siteId);

    let site = await getSiteById(decoded);
    if (!site && useNianticFixtures()) {
        const fixture = loadFixtureCoverage();
        const sites = geoJsonToSiteEntities(fixture);
        site = sites.find((s) => s.siteId === decoded) ?? null;
    }

    if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site);
}
