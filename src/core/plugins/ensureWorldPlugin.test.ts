import { describe, it, expect } from "vitest";
import { ensureWorldPlugin } from "./ensureWorldPlugin";
import type { WorldPlugin } from "./PluginTypes";
import type { PluginManifest } from "./PluginManifest";

describe("ensureWorldPlugin", () => {
    it("adds missing WorldPlugin methods", () => {
        const stub = { id: "test" } as WorldPlugin;
        const manifest: PluginManifest = {
            id: "test",
            name: "Test",
            version: "1.0.0",
            entry: "/plugins-local/test/frontend.mjs",
            format: "bundle",
            type: "data-layer",
        };

        const plugin = ensureWorldPlugin(stub, manifest);

        expect(typeof plugin.getPollingInterval).toBe("function");
        expect(plugin.getPollingInterval()).toBe(10_000);
        expect(typeof plugin.fetch).toBe("function");
        expect(typeof plugin.renderEntity).toBe("function");
        expect(plugin.name).toBe("Test");
    });

    it("uses zero polling for extension manifests", () => {
        const stub = { id: "ext-ui" } as WorldPlugin;
        const manifest: PluginManifest = {
            id: "ext-ui",
            name: "Ext",
            version: "1.0.0",
            entry: "/plugins-local/ext-ui/frontend.mjs",
            format: "bundle",
            type: "extension",
            extends: ["iss"],
        };

        const plugin = ensureWorldPlugin(stub, manifest);
        expect(plugin.getPollingInterval()).toBe(0);
    });
});
