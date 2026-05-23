import type { PluginManifest } from "./PluginManifest";

/**
 * Known-broken CDN entries → local dev bundles under /plugins-local/.
 * Browser-safe (no Node fs): remapping is pattern-based only.
 */
const LOCAL_FALLBACKS: Record<string, string> = {
    iss: "/plugins-local/iss/frontend.mjs",
};

function isBrokenIssCdn(entry: string): boolean {
    return entry.includes("@nullptr1945/wwv-plugin-iss")
        || (entry.includes("unpkg.com") && entry.includes("wwv-plugin-iss"));
}

/**
 * Rewrites manifest entry URLs that are known 404s to local dev bundle paths.
 * Safe to import from client code (PluginManager / loadPluginFromManifest).
 */
export function patchManifestEntry(manifest: PluginManifest): PluginManifest {
    const entry = manifest.entry?.trim();
    if (!entry || !manifest.id) return manifest;

    if (manifest.id === "iss" && (isBrokenIssCdn(entry) || entry.startsWith("https://unpkg.com"))) {
        const fallback = LOCAL_FALLBACKS.iss;
        if (entry !== fallback) {
            console.warn(
                `[patchManifestEntry] Remapping ISS entry from ${entry} to ${fallback}`,
            );
            return { ...manifest, entry: fallback };
        }
    }

    const fallback = LOCAL_FALLBACKS[manifest.id];
    if (fallback && entry.startsWith("http") && entry !== fallback) {
        return { ...manifest, entry: fallback };
    }

    return manifest;
}
