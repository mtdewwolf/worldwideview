import type { WorldPlugin, PluginContext, GeoEntity } from "@/core/plugins/PluginTypes";
import { dataBus } from "@/core/data/DataBus";
import { resolveEngineUrl } from "@/core/data/resolveEngineUrl";
import { useStore } from "@/core/state/store";
import { trackEvent } from "@/lib/analytics";

/** Collect NEXT_PUBLIC_WWV_PLUGIN_* env vars for plugin context injection. */
export function collectPluginEnvVars(): Record<string, string> {
    const envVars: Record<string, string> = {};
    if (typeof process !== "undefined" && process.env) {
        for (const [key, value] of Object.entries(process.env)) {
            if (key.startsWith("NEXT_PUBLIC_WWV_PLUGIN_")) {
                envVars[key.replace("NEXT_PUBLIC_WWV_PLUGIN_", "")] = value || "";
            }
        }
    }

    const rawEngineUrl = process.env.NEXT_PUBLIC_WWV_PLUGIN_DATA_ENGINE_URL;
    const httpEngineUrl = rawEngineUrl
        ? rawEngineUrl.replace(/\/stream$/, "").replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://")
        : undefined;

    const explicitVars: Record<string, string | undefined> = {
        DATA_ENGINE_URL: httpEngineUrl,
    };
    for (const [k, v] of Object.entries(explicitVars)) {
        if (v && !envVars[k]) envVars[k] = v;
    }

    return envVars;
}

export function buildPluginContext(
    plugin: WorldPlugin,
    envVars: Record<string, string>,
    onDataUpdate: (entities: GeoEntity[]) => void,
): PluginContext {
    const edition = (process.env.NEXT_PUBLIC_WWV_EDITION || "local") as "local" | "cloud" | "demo";
    const wsUrl = resolveEngineUrl(plugin.id);
    const apiBaseUrl = wsUrl
        .replace(/\/stream$/, "")
        .replace(/^ws:\/\//, "http://")
        .replace(/^wss:\/\//, "https://");

    return {
        apiBaseUrl,
        getEngineUrl: () => {
            const ws = resolveEngineUrl(plugin.id);
            return ws.replace(/\/stream$/, "").replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
        },
        env: envVars,
        edition,
        timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
        },
        onDataUpdate,
        onError: (error) => {
            const msg = error.message ?? "";
            const isNonFatalFetch =
                (error instanceof TypeError && msg === "Failed to fetch")
                || msg.includes("Data Engine API returned 404")
                || msg.includes("Data Engine API returned 503");
            if (isNonFatalFetch) {
                console.warn(
                    "[Plugin:%s] Non-fatal fetch (WS or engine REST unavailable): %s",
                    plugin.id,
                    msg,
                );
                return;
            }
            console.error("[Plugin:%s]", plugin.id, error);
            trackEvent("plugin-error", { plugin: plugin.id, error: error.message });
            dataBus.emit("pluginError", { pluginId: plugin.id, message: `[${plugin.name || plugin.id}] ${error.message}`, error });
        },
        getPluginSettings: <T = unknown>(pluginId: string) => useStore.getState().dataConfig.pluginSettings[pluginId] as T | undefined,
        isPlaybackMode: () => useStore.getState().isPlaybackMode,
        getCurrentTime: () => useStore.getState().currentTime,
    };
}
