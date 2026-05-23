import fs from "fs";
import path from "path";
import type { NianticCoverageGeoJson, NianticSiteEntity } from "./types";

const FIXTURE_PATH = path.join(
    process.cwd(),
    "public",
    "e2e-fixtures",
    "niantic-coverage.json",
);

/** Haversine distance in meters between two WGS84 points. */
export function haversineMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export function sitesToGeoJson(sites: NianticSiteEntity[]): NianticCoverageGeoJson {
    return {
        type: "FeatureCollection",
        features: sites.map((site) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [site.lng, site.lat],
            },
            properties: {
                ...site,
                type: "niantic-vps-site",
            },
        })),
    };
}

export function loadFixtureCoverage(): NianticCoverageGeoJson {
    const raw = fs.readFileSync(FIXTURE_PATH, "utf-8");
    const data = JSON.parse(raw) as NianticCoverageGeoJson;
    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        throw new Error("Invalid niantic-coverage fixture");
    }
    return data;
}

export function geoJsonToSiteEntities(geo: NianticCoverageGeoJson): NianticSiteEntity[] {
    return geo.features.map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties;
        return {
            siteId: p.siteId,
            name: p.name,
            lat,
            lng,
            imageUrl: p.imageUrl,
            hasMesh: p.hasMesh,
            payloadBase64: p.payloadBase64,
            headingDeg: p.headingDeg,
            alt: p.alt,
        };
    });
}

export function filterSitesByRadius(
    sites: NianticSiteEntity[],
    lat: number,
    lng: number,
    radiusM: number,
): NianticSiteEntity[] {
    return sites.filter(
        (s) => haversineMeters(lat, lng, s.lat, s.lng) <= radiusM,
    );
}

export function seederPayloadFromSites(sites: NianticSiteEntity[]) {
    return {
        source: "niantic-vps",
        fetchedAt: new Date().toISOString(),
        items: sites,
        totalCount: sites.length,
    };
}
