/**
 * Fetches OpenStreetMap quarry / mineshaft features for the Mineral Mines marketplace plugin.
 * Output: public/data/mineral_mines.geojson (expected by @worldwideview/wwv-plugin-mineral-mines).
 *
 * Usage: node scripts/fetch-mineral-mines-geojson.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "static");
const OUT_FILE = path.join(OUT_DIR, "mineral_mines.geojson");
const LEGACY_FILE = path.join(ROOT, "public", "data", "mineral_mines.geojson");

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
];

const QUERY = `
[out:json][timeout:240];
(
  node["landuse"="quarry"];
  node["man_made"="mineshaft"];
  way["landuse"="quarry"];
  way["man_made"="mineshaft"];
);
out center;
`;

function elementToFeature(el) {
    let lon;
    let lat;
    if (el.type === "node") {
        lon = el.lon;
        lat = el.lat;
    } else if (el.center) {
        lon = el.center.lon;
        lat = el.center.lat;
    } else {
        return null;
    }
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

    const tags = el.tags ?? {};
    return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: {
            name: tags.name ?? tags.operator ?? "Mine / quarry",
            osm_id: el.id,
            osm_type: el.type,
            landuse: tags.landuse,
            man_made: tags.man_made,
            resource: tags.resource,
        },
    };
}

async function queryOverpass() {
    const headers = {
        Accept: "application/json",
        "User-Agent": "WorldWideView-dev/1.0 (bun run data:mineral-mines)",
    };
    let lastError = "no endpoints tried";

    for (const base of OVERPASS_ENDPOINTS) {
        const url = `${base}?data=${encodeURIComponent(QUERY.trim())}`;
        console.log(`[fetch-mineral-mines] GET ${base}…`);
        const res = await fetch(url, { headers });
        if (!res.ok) {
            lastError = `${base} HTTP ${res.status}`;
            continue;
        }
        return res.json();
    }

    throw new Error(lastError);
}

async function main() {
    console.log("[fetch-mineral-mines] Querying Overpass API…");
    const data = await queryOverpass();
    const features = (data.elements ?? [])
        .map(elementToFeature)
        .filter(Boolean);

    if (features.length === 0) {
        throw new Error("Overpass returned zero features — try again later or check query");
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
        OUT_FILE,
        JSON.stringify({ type: "FeatureCollection", features }, null, 0),
        "utf-8",
    );

    console.log(`[fetch-mineral-mines] Wrote ${features.length} features → ${OUT_FILE}`);

    if (fs.existsSync(LEGACY_FILE)) {
        fs.unlinkSync(LEGACY_FILE);
        console.log("[fetch-mineral-mines] Removed legacy public/data copy (use App Route only)");
    }
}

main().catch((err) => {
    console.error("[fetch-mineral-mines] Failed:", err);
    process.exit(1);
});
