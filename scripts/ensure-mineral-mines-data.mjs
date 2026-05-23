/**
 * Ensures public/data/mineral_mines.geojson exists for the Mineral Mines marketplace plugin.
 * Skips when the file is already present; does not block dev if Overpass is unavailable.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_FILE = path.join(__dirname, "..", "data", "static", "mineral_mines.geojson");
const LEGACY_FILE = path.join(__dirname, "..", "public", "data", "mineral_mines.geojson");

if (fs.existsSync(STATIC_FILE) && fs.statSync(STATIC_FILE).size > 100) {
    process.exit(0);
}

// One-time migration: move legacy public file out of /public to avoid Next.js route conflict
if (fs.existsSync(LEGACY_FILE) && fs.statSync(LEGACY_FILE).size > 100) {
    fs.mkdirSync(path.dirname(STATIC_FILE), { recursive: true });
    fs.renameSync(LEGACY_FILE, STATIC_FILE);
    console.log("[ensure-mineral-mines] Moved legacy public/data file → data/static/");
    process.exit(0);
}

console.warn(
    "[ensure-mineral-mines] Missing data/static/mineral_mines.geojson — "
    + "Mineral Mines layer will log errors until you run: bun run data:mineral-mines",
);
