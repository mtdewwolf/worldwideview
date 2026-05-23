import { prisma } from "@/lib/db";
import type { NianticSiteEntity } from "./types";
import { meshExists } from "./meshStorage";

export async function upsertSites(sites: NianticSiteEntity[]): Promise<void> {
    for (const site of sites) {
        const hasMesh = site.hasMesh ?? meshExists(site.siteId);
        await prisma.nianticSiteCache.upsert({
            where: { siteId: site.siteId },
            create: {
                siteId: site.siteId,
                lat: site.lat,
                lng: site.lng,
                name: site.name,
                meshPath: hasMesh ? site.siteId : null,
                metadata: {
                    imageUrl: site.imageUrl,
                    payloadBase64: site.payloadBase64,
                    headingDeg: site.headingDeg,
                    alt: site.alt,
                },
            },
            update: {
                lat: site.lat,
                lng: site.lng,
                name: site.name,
                meshPath: hasMesh ? site.siteId : undefined,
                metadata: {
                    imageUrl: site.imageUrl,
                    payloadBase64: site.payloadBase64,
                    headingDeg: site.headingDeg,
                    alt: site.alt,
                },
            },
        });
    }
}

export async function findSitesNear(
    lat: number,
    lng: number,
    radiusM: number,
): Promise<NianticSiteEntity[]> {
    const rows = await prisma.nianticSiteCache.findMany();
    const { filterSitesByRadius } = await import("./coverage");
    const sites: NianticSiteEntity[] = rows.map((row) => {
        const meta = (row.metadata ?? {}) as Record<string, unknown>;
        return {
            siteId: row.siteId,
            name: row.name ?? row.siteId,
            lat: row.lat,
            lng: row.lng,
            imageUrl: meta.imageUrl as string | undefined,
            hasMesh: !!row.meshPath || meshExists(row.siteId),
            payloadBase64: meta.payloadBase64 as string | undefined,
            headingDeg: meta.headingDeg as number | undefined,
            alt: meta.alt as number | undefined,
        };
    });
    return filterSitesByRadius(sites, lat, lng, radiusM);
}

export async function getSiteById(siteId: string): Promise<NianticSiteEntity | null> {
    const row = await prisma.nianticSiteCache.findUnique({ where: { siteId } });
    if (!row) return null;
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
        siteId: row.siteId,
        name: row.name ?? row.siteId,
        lat: row.lat,
        lng: row.lng,
        imageUrl: meta.imageUrl as string | undefined,
        hasMesh: !!row.meshPath || meshExists(row.siteId),
        payloadBase64: meta.payloadBase64 as string | undefined,
        headingDeg: meta.headingDeg as number | undefined,
        alt: meta.alt as number | undefined,
    };
}

export async function setSiteMeshPath(siteId: string): Promise<void> {
    await prisma.nianticSiteCache.upsert({
        where: { siteId },
        create: {
            siteId,
            lat: 0,
            lng: 0,
            name: siteId,
            meshPath: siteId,
            metadata: {},
        },
        update: { meshPath: siteId },
    });
}
