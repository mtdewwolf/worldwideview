import type {
    WorldPlugin,
    GeoEntity,
    CesiumEntityOptions,
    PluginContext,
    LayerConfig,
    TimeRange,
    ServerPluginConfig,
} from "@worldwideview/wwv-plugin-sdk";
const PLUGIN_ID = "niantic-vps";
const SITE_ICON =
    "data:image/svg+xml;charset=utf-8,"
    + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        + '<circle cx="16" cy="16" r="14" fill="#7c3aed" stroke="#e9d5ff" stroke-width="2"/>'
        + '<text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">V</text>'
        + "</svg>",
    );

interface SiteItem {
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

export default class NianticVpsPlugin implements WorldPlugin {
    id = PLUGIN_ID;
    name = "Niantic VPS Sites";
    description = "Niantic Spatial VPS site coverage";
    category = "intelligence" as const;
    version = "1.0.0";

    private context: PluginContext | null = null;
    private cameraPollTimer: ReturnType<typeof setInterval> | null = null;

    async initialize(context: PluginContext): Promise<void> {
        this.context = context;
        this.startCameraCoverageSync();
    }

    destroy(): void {
        if (this.cameraPollTimer) {
            clearInterval(this.cameraPollTimer);
            this.cameraPollTimer = null;
        }
        this.context = null;
    }

    private startCameraCoverageSync(): void {
        const settings = this.context?.getPluginSettings<{ syncWithCamera?: boolean }>(PLUGIN_ID);
        if (settings?.syncWithCamera === false) return;

        const poll = async () => {
            const store = (globalThis as { __WWV_HOST__?: { useStore?: { getState: () => {
                camera?: { latitude?: number; longitude?: number };
            } } } }).__WWV_HOST__?.useStore;
            const camera = store?.getState()?.camera;
            const lat = camera?.latitude;
            const lng = camera?.longitude;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            try {
                const res = await fetch(
                    `/api/niantic/coverage?lat=${lat}&lng=${lng}&radiusM=8000`,
                );
                if (!res.ok) return;
                const geo = await res.json();
                const entities = this.payloadToEntities({ items: this.geoToItems(geo) });
                this.context?.onDataUpdate(entities);
            } catch {
                /* ignore transient network errors */
            }
        };

        void poll();
        this.cameraPollTimer = setInterval(() => { void poll(); }, 20_000);
    }

    private geoToItems(geo: { features?: Array<{ properties?: SiteItem; geometry?: { coordinates?: number[] } }> }): SiteItem[] {
        if (!geo?.features) return [];
        return geo.features.map((f) => {
            const p = f.properties ?? {} as SiteItem;
            const [lng, lat] = f.geometry?.coordinates ?? [p.lng, p.lat];
            return {
                siteId: p.siteId,
                name: p.name ?? p.siteId,
                lat: p.lat ?? lat,
                lng: p.lng ?? lng,
                imageUrl: p.imageUrl,
                hasMesh: p.hasMesh,
                payloadBase64: p.payloadBase64,
                headingDeg: p.headingDeg,
                alt: p.alt,
            };
        });
    }

    getPollingInterval(): number {
        return 0;
    }

    async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
        return [];
    }

    mapWebsocketPayload(payload: { items?: SiteItem[] } | SiteItem[]): GeoEntity[] {
        const items = Array.isArray(payload)
            ? payload
            : (payload?.items ?? []);
        return this.payloadToEntities({ items });
    }

    private payloadToEntities(payload: { items: SiteItem[] }): GeoEntity[] {
        return payload.items
            .filter((s) => s.siteId && Number.isFinite(s.lat) && Number.isFinite(s.lng))
            .map((s) => ({
                id: `${PLUGIN_ID}-${s.siteId}`,
                pluginId: PLUGIN_ID,
                latitude: s.lat,
                longitude: s.lng,
                altitude: s.alt ?? 0,
                heading: 0,
                timestamp: new Date(),
                label: s.name,
                properties: {
                    siteId: s.siteId,
                    imageUrl: s.imageUrl,
                    hasMesh: s.hasMesh,
                    payloadBase64: s.payloadBase64,
                    headingDeg: s.headingDeg,
                },
            }));
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#7c3aed",
            clusterEnabled: true,
            clusterDistance: 48,
            maxEntities: 2000,
        };
    }

    getServerConfig(): ServerPluginConfig {
        return {
            apiBasePath: "/api/niantic/coverage",
            pollingIntervalMs: 0,
            streamUrl: "wss://dataenginev2.worldwideview.dev/stream",
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        return {
            type: "billboard",
            iconUrl: SITE_ICON,
            iconScale: 0.85,
            color: "#c4b5fd",
            labelText: entity.label,
            labelFont: "11px JetBrains Mono, monospace",
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        };
    }

    renderHUD(entity: GeoEntity): string {
        const siteId = entity.properties.siteId as string;
        const hasMesh = entity.properties.hasMesh ? "Yes" : "No";
        const arUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?arSite=${encodeURIComponent(siteId)}`;
        return `<div class="niantic-vps-hud">
          <h3>${entity.label ?? siteId}</h3>
          <p>Site ID: ${siteId}</p>
          <p>Mesh available: ${hasMesh}</p>
          <p><a href="${arUrl}" target="_blank" rel="noopener">Open in AR</a></p>
        </div>`;
    }
}
