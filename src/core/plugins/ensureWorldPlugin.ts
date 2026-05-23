/**
 * Hardens dynamically loaded bundles that omit optional or required WorldPlugin methods.
 */

import type {
    WorldPlugin,
    GeoEntity,
    CesiumEntityOptions,
    LayerConfig,
    PluginContext,
    TimeRange,
} from "./PluginTypes";
import type { PluginManifest } from "./PluginManifest";

const NOOP_ASYNC = async () => {};
const EMPTY_LAYER: LayerConfig = {
    color: "#94a3b8",
    clusterEnabled: false,
    clusterDistance: 40,
    maxEntities: 1000,
};

/**
 * Ensures a loaded bundle exposes the WorldPlugin surface PluginManager expects.
 */
export function ensureWorldPlugin(
    plugin: WorldPlugin,
    manifest: PluginManifest,
): WorldPlugin {
    const p = plugin as WorldPlugin;

    if (manifest.id && p.id !== manifest.id) {
        p.id = manifest.id;
    }

    if (typeof p.initialize !== "function") {
        p.initialize = NOOP_ASYNC as (ctx: PluginContext) => Promise<void>;
    }
    if (typeof p.destroy !== "function") {
        p.destroy = () => {};
    }
    if (typeof p.fetch !== "function") {
        p.fetch = async (_timeRange: TimeRange) => [];
    }
    if (typeof p.getPollingInterval !== "function") {
        p.getPollingInterval = () => (manifest.type === "extension" ? 0 : 10_000);
    }
    if (typeof p.getLayerConfig !== "function") {
        p.getLayerConfig = () => EMPTY_LAYER;
    }
    if (typeof p.renderEntity !== "function") {
        p.renderEntity = (_entity: GeoEntity): CesiumEntityOptions => ({
            type: "point",
            size: 0,
        });
    }

    if (!p.name) p.name = manifest.name ?? p.id;
    if (!p.description) p.description = manifest.description ?? "";
    if (!p.version) p.version = manifest.version ?? "0.0.0";
    if (!p.category) p.category = (manifest.category as WorldPlugin["category"]) ?? "custom";
    if (!p.icon) p.icon = "Box";

    return p;
}
