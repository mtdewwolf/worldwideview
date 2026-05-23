import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSpatialTokenCache, getSpatialAccessToken } from "./spatialIdentity";

describe("spatialIdentity", () => {
    const origKey = process.env.NIANTIC_SPATIAL_API_KEY;
    const origTtl = process.env.NIANTIC_SPATIAL_TOKEN_CACHE_TTL_SEC;

    beforeEach(() => {
        clearSpatialTokenCache();
        process.env.NIANTIC_SPATIAL_API_KEY = "test-key";
        process.env.NIANTIC_SPATIAL_TOKEN_CACHE_TTL_SEC = "60";
    });

    afterEach(() => {
        process.env.NIANTIC_SPATIAL_API_KEY = origKey;
        process.env.NIANTIC_SPATIAL_TOKEN_CACHE_TTL_SEC = origTtl;
        vi.restoreAllMocks();
        clearSpatialTokenCache();
    });

    it("exchanges API key for access token", async () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        const origFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ accessToken: "jwt-abc", expiresAt }),
        }) as typeof fetch;

        const token = await getSpatialAccessToken();
        globalThis.fetch = origFetch;
        expect(token.accessToken).toBe("jwt-abc");
        expect(token.expiresAt).toBe(expiresAt);
    });

    it("returns cached token without second fetch", async () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ accessToken: "jwt-abc", expiresAt }),
        });
        const origFetch = globalThis.fetch;
        globalThis.fetch = fetchMock as typeof fetch;

        await getSpatialAccessToken();
        await getSpatialAccessToken();
        globalThis.fetch = origFetch;
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws when API key is missing", async () => {
        delete process.env.NIANTIC_SPATIAL_API_KEY;
        clearSpatialTokenCache();
        await expect(getSpatialAccessToken()).rejects.toThrow(/not configured/);
    });
});
