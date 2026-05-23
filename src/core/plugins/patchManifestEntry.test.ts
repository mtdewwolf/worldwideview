import { describe, it, expect } from "vitest";
import { patchManifestEntry } from "./patchManifestEntry";
import type { PluginManifest } from "./PluginManifest";

describe("patchManifestEntry", () => {
    it("remaps broken ISS unpkg URLs to local bundle", () => {
        const manifest: PluginManifest = {
            id: "iss",
            name: "ISS",
            version: "1.1.1",
            entry: "https://unpkg.com/@nullptr1945/wwv-plugin-iss@1.1.1/dist/frontend.mjs",
            format: "bundle",
            type: "data-layer",
        };

        const patched = patchManifestEntry(manifest);
        expect(patched.entry).toBe("/plugins-local/iss/frontend.mjs");
    });

    it("leaves already-local entries unchanged", () => {
        const manifest: PluginManifest = {
            id: "iss",
            name: "ISS",
            version: "1.1.2",
            entry: "/plugins-local/iss/frontend.mjs",
            format: "bundle",
            type: "data-layer",
        };

        expect(patchManifestEntry(manifest).entry).toBe("/plugins-local/iss/frontend.mjs");
    });
});
