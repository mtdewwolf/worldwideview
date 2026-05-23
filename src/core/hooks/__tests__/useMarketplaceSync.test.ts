import {
 describe, it, expect, beforeEach, vi,
} from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMarketplaceSync } from "../useMarketplaceSync";
import { pluginManager } from "@/core/plugins/PluginManager";

vi.mock("@/core/plugins/PluginManager", () => ({
    pluginManager: {
        getPlugin: vi.fn(),
        loadFromManifest: vi.fn(),
        enablePlugin: vi.fn(),
    },
}));

vi.mock("@/core/state/store", () => {
    const initLayer = vi.fn();
    return {
        useStore: (selector: (s: { initLayer: typeof initLayer }) => unknown) => selector({ initLayer }),
        __initLayer: initLayer,
    };
});

vi.mock("@/lib/marketplace/trustedPlugins", () => ({
    getApprovedUnverifiedIds: () => new Set<string>(),
    approveUnverifiedPlugin: vi.fn(),
}));

vi.mock("@/core/edition", () => ({
    isDemo: false,
}));

const mockManifest = {
    id: "test-plugin",
    name: "Test Plugin",
    version: "1.0.0",
    format: "bundle" as const,
    entry: "https://example.com/plugin.mjs",
    trust: "verified" as const,
};

describe("useMarketplaceSync", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(pluginManager.getPlugin).mockReturnValue(undefined);
        vi.mocked(pluginManager.loadFromManifest).mockResolvedValue(undefined);
        vi.mocked(pluginManager.enablePlugin).mockResolvedValue(undefined);
    });

    it("enables plugins not in disabled-builtins set (non-demo)", async () => {
        const fetchMock = vi.fn(async (url: string) => {
            if (url.includes("disabled-builtins")) {
                return { ok: true, json: async () => ({ disabledIds: [] }) };
            }
            if (url.includes("marketplace/load")) {
                return { ok: true, json: async () => ({ manifests: [mockManifest] }) };
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        renderHook(() => useMarketplaceSync(true));

        await waitFor(() => {
            expect(pluginManager.loadFromManifest).toHaveBeenCalledWith(mockManifest);
        });
        await waitFor(() => {
            expect(pluginManager.enablePlugin).toHaveBeenCalledWith("test-plugin");
        });

        vi.unstubAllGlobals();
    });

    it("skips enable for plugins in disabled-builtins set (non-demo)", async () => {
        const fetchMock = vi.fn(async (url: string) => {
            if (url.includes("disabled-builtins")) {
                return { ok: true, json: async () => ({ disabledIds: ["test-plugin"] }) };
            }
            if (url.includes("marketplace/load")) {
                return { ok: true, json: async () => ({ manifests: [mockManifest] }) };
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        renderHook(() => useMarketplaceSync(true));

        await waitFor(() => {
            expect(pluginManager.loadFromManifest).toHaveBeenCalledWith(mockManifest);
        });
        expect(pluginManager.enablePlugin).not.toHaveBeenCalled();

        vi.unstubAllGlobals();
    });
});
