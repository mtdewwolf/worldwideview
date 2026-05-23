/**
 * Cesium mesh loader for Niantic site GLB assets (via getGlobeComponent).
 */
import { useEffect, useRef } from "react";

const MAX_MESHES = 8;
const PLUGIN_ID = "niantic-mesh";

interface GlobeCompProps {
    viewer: import("cesium").Viewer | null;
    enabled: boolean;
}

type CesiumNs = typeof import("cesium");

type WwvStore = {
    getState: () => {
        selectedEntity: GeoEntityLike | null;
        entitiesByPlugin: Record<string, GeoEntityLike[]>;
    };
};

interface GeoEntityLike {
    latitude: number;
    longitude: number;
    properties?: Record<string, unknown>;
}

function getHost(): {
    useStore: WwvStore;
    Cesium: CesiumNs;
} | null {
    const h = (globalThis as { __WWV_HOST__?: unknown }).__WWV_HOST__;
    if (!h || typeof h !== "object") return null;
    return h as { useStore: WwvStore; Cesium: CesiumNs };
}

export function NianticMeshGlobe({ viewer, enabled }: GlobeCompProps) {
    const modelsRef = useRef<Map<string, import("cesium").Model>>(new Map());
    const host = getHost();
    const selectedEntity = host?.useStore.getState().selectedEntity ?? null;
    const vpsKey = "niantic-vps";

    useEffect(() => {
        const host = getHost();
        if (!host || !viewer || viewer.isDestroyed() || !enabled) {
            return undefined;
        }

        const { Cesium, useStore } = host;
        const { Cartesian3, Transforms, HeadingPitchRoll, Math: CesiumMath, Model } = Cesium;

        const siteIds = new Set<string>();

        if (selectedEntity?.properties?.siteId) {
            siteIds.add(String(selectedEntity.properties.siteId));
        }

        const vpsEntities = host?.useStore.getState().entitiesByPlugin[vpsKey] ?? [];
        for (const e of vpsEntities) {
            if (e.properties?.hasMesh && e.properties?.siteId) {
                siteIds.add(String(e.properties.siteId));
            }
            if (siteIds.size >= MAX_MESHES) break;
        }

        const toLoad = [...siteIds].slice(0, MAX_MESHES);
        const active = modelsRef.current;

        for (const [id, model] of active) {
            if (!toLoad.includes(id)) {
                viewer.scene.primitives.remove(model);
                model.destroy();
                active.delete(id);
            }
        }

        let cancelled = false;

        async function loadSite(siteId: string) {
            if (active.has(siteId) || cancelled) return;

            const entity = vpsEntities.find((e) => e.properties?.siteId === siteId)
                ?? (selectedEntity?.properties?.siteId === siteId ? selectedEntity : null);
            if (!entity) return;

            const lat = entity.latitude;
            const lng = entity.longitude;
            const alt = (entity.properties?.alt as number) ?? 0;
            const headingDeg = (entity.properties?.headingDeg as number) ?? 0;

            const position = Cartesian3.fromDegrees(lng, lat, alt);
            const hpr = new HeadingPitchRoll(
                CesiumMath.toRadians(headingDeg),
                0,
                0,
            );
            const modelMatrix = Transforms.headingPitchRollToFixedFrame(position, hpr);

            try {
                const model = await Model.fromGltfAsync({
                    url: `/api/niantic/mesh/${encodeURIComponent(siteId)}`,
                    modelMatrix,
                    scale: (entity.properties?.meshScale as number) ?? 1,
                    minimumPixelSize: 32,
                });
                if (cancelled || viewer.isDestroyed()) {
                    model.destroy();
                    return;
                }
                viewer.scene.primitives.add(model);
                active.set(siteId, model);
            } catch (err) {
                console.warn(`[${PLUGIN_ID}] Failed to load mesh ${siteId}:`, err);
            }
        }

        void Promise.all(toLoad.map((id) => loadSite(id)));

        return () => {
            cancelled = true;
        };
    }, [viewer, enabled, selectedEntity?.id, selectedEntity?.properties?.siteId]);

    useEffect(() => {
        return () => {
            if (!viewer || viewer.isDestroyed()) return;
            for (const model of modelsRef.current.values()) {
                viewer.scene.primitives.remove(model);
                model.destroy();
            }
            modelsRef.current.clear();
        };
    }, [viewer]);

    return null;
}
