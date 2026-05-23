/**
 * Shared Niantic Spatial types for API routes, seeders, and plugins.
 */

export interface NianticSiteEntity {
    siteId: string;
    name: string;
    lat: number;
    lng: number;
    imageUrl?: string;
    hasMesh?: boolean;
    payloadBase64?: string;
    headingDeg?: number;
    alt?: number;
}

export interface NianticCoverageGeoJson {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: { type: "Point"; coordinates: [number, number] };
        properties: NianticSiteEntity & { type: "niantic-vps-site" };
    }>;
}

export interface NianticSiteTransform {
    lat: number;
    lng: number;
    alt?: number;
    headingDeg?: number;
    scale?: number;
}

export interface SpatialTokenResponse {
    accessToken: string;
    expiresAt: number;
}
