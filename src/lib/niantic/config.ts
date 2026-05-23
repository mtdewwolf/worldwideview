import { isNianticSpatialEnabled as nianticSpatialEnabledFlag } from "@/core/edition";

/** Server-side gate for Niantic API routes (wraps edition boolean). */
export function isNianticSpatialEnabled(): boolean {
    return nianticSpatialEnabledFlag;
}

export function useNianticFixtures(): boolean {
    return process.env.NIANTIC_SPATIAL_USE_FIXTURES === "true";
}

export function getMeshUploadSecret(): string | undefined {
    return (
        process.env.NIANTIC_MESH_UPLOAD_SECRET?.trim()
        || process.env.WWV_BRIDGE_TOKEN?.trim()
        || undefined
    );
}

export function getWwvAppBaseUrl(): string {
    return (
        process.env.WWV_APP_URL?.trim()
        || process.env.NEXTAUTH_URL?.trim()
        || "http://localhost:3000"
    );
}
