import type {
    WorldPlugin,
    GeoEntity,
    CesiumEntityOptions,
    PluginContext,
    LayerConfig,
    TimeRange,
} from "@worldwideview/wwv-plugin-sdk";
import { NianticMeshGlobe } from "./NianticMeshGlobe";

const PLUGIN_ID = "niantic-mesh";

export default class NianticMeshPlugin implements WorldPlugin {
    id = PLUGIN_ID;
    name = "Niantic Site Meshes";
    description = "3D mesh overlays from Niantic Spatial VPS sites";
    category = "intelligence" as const;
    version = "1.0.0";

    async initialize(_context: PluginContext): Promise<void> {
        /* rendering via getGlobeComponent */
    }

    destroy(): void {}

    getPollingInterval(): number {
        return 0;
    }

    async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
        return [];
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#a78bfa",
            clusterEnabled: false,
            clusterDistance: 0,
            maxEntities: 0,
            disableDefaultRendering: true,
        };
    }

    renderEntity(_entity: GeoEntity): CesiumEntityOptions {
        return { type: "point", size: 0 };
    }

    getGlobeComponent() {
        return NianticMeshGlobe;
    }
}
