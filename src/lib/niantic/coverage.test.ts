import { describe, expect, it } from "vitest";
import {
    filterSitesByRadius,
    geoJsonToSiteEntities,
    haversineMeters,
    sitesToGeoJson,
} from "./coverage";

describe("coverage", () => {
    it("filters sites within radius", () => {
        const sites = [
            { siteId: "a", name: "A", lat: 37.7749, lng: -122.4194 },
            { siteId: "b", name: "B", lat: 51.5074, lng: -0.1276 },
        ];
        const near = filterSitesByRadius(sites, 37.7749, -122.4194, 1000);
        expect(near).toHaveLength(1);
        expect(near[0].siteId).toBe("a");
    });

    it("round-trips GeoJSON", () => {
        const geo = sitesToGeoJson([
            { siteId: "x", name: "X", lat: 10, lng: 20 },
        ]);
        const back = geoJsonToSiteEntities(geo);
        expect(back[0].siteId).toBe("x");
        expect(back[0].lat).toBe(10);
        expect(back[0].lng).toBe(20);
    });

    it("haversine is zero for same point", () => {
        expect(haversineMeters(0, 0, 0, 0)).toBe(0);
    });
});
