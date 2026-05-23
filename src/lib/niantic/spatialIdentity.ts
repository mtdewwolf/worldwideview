/**
 * Niantic Spatial Identity Service — service-account token exchange with in-memory cache.
 * @see https://nianticspatial.com/docs/nsdk/auth_backend/
 */

import type { SpatialTokenResponse } from "./types";

const TOKEN_URL = "https://spatial-identity.nianticspatial.com/oauth/token";

let cachedToken: SpatialTokenResponse | null = null;

function cacheMarginSec(): number {
    const raw = process.env.NIANTIC_SPATIAL_TOKEN_CACHE_TTL_SEC;
    const parsed = raw ? Number.parseInt(raw, 10) : 60;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;
}

function isCacheValid(token: SpatialTokenResponse): boolean {
    const margin = cacheMarginSec();
    return token.expiresAt - margin > Math.floor(Date.now() / 1000);
}

export function clearSpatialTokenCache(): void {
    cachedToken = null;
}

/**
 * Returns a short-lived JWT for NSDK clients. Uses service account API key from env.
 */
export async function getSpatialAccessToken(): Promise<SpatialTokenResponse> {
    if (cachedToken && isCacheValid(cachedToken)) {
        return cachedToken;
    }

    const apiKey = process.env.NIANTIC_SPATIAL_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("NIANTIC_SPATIAL_API_KEY is not configured");
    }

    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            grantType: "exchange_api_key_access_token",
            apiKey,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Niantic token exchange failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as { accessToken?: string; expiresAt?: number };
    if (!data.accessToken || !data.expiresAt) {
        throw new Error("Niantic token response missing accessToken or expiresAt");
    }

    cachedToken = {
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
    };
    return cachedToken;
}

export function isNianticConfigured(): boolean {
    return !!process.env.NIANTIC_SPATIAL_API_KEY?.trim();
}
