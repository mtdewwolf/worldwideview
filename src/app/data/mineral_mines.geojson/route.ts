import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { Readable } from "stream";

const DATA_CANDIDATES = [
    path.join(process.cwd(), "data", "static", "mineral_mines.geojson"),
    path.join(process.cwd(), "public", "data", "mineral_mines.geojson"),
];

function resolveDataFile(): string | null {
    for (const file of DATA_CANDIDATES) {
        if (existsSync(file) && statSync(file).size >= 100) return file;
    }
    return null;
}

const EMPTY_COLLECTION = JSON.stringify({
    type: "FeatureCollection",
    features: [],
});

/**
 * Serves Mineral Mines OSM data as JSON (never HTML).
 * The marketplace plugin loads `/data/mineral_mines.geojson` via Cesium;
 * a missing static file would otherwise return a Next.js HTML 404 → SyntaxError.
 */
export async function GET() {
    const dataFile = resolveDataFile();
    if (!dataFile) {
        return new NextResponse(EMPTY_COLLECTION, {
            status: 200,
            headers: {
                "Content-Type": "application/geo+json; charset=utf-8",
                "Cache-Control": "no-store",
                "X-WWV-Mineral-Mines": "empty-run-bun-data-mineral-mines",
            },
        });
    }

    const stream = createReadStream(dataFile);
    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
        headers: {
            "Content-Type": "application/geo+json; charset=utf-8",
            "Cache-Control": "public, max-age=86400, immutable",
        },
    });
}
