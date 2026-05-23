"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/core/state/store";

/**
 * Handles ?arSite= deep links from the Unity companion or shared URLs.
 */
export function NianticArDeepLink() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const setCameraPosition = useStore((s) => s.setCameraPosition);
    const setSelectedEntity = useStore((s) => s.setSelectedEntity);

    useEffect(() => {
        const siteId = searchParams.get("arSite");
        if (!siteId) return;

        void (async () => {
            try {
                const res = await fetch(`/api/niantic/sites/${encodeURIComponent(siteId)}`);
                if (!res.ok) return;
                const site = await res.json() as {
                    siteId: string;
                    name: string;
                    lat: number;
                    lng: number;
                    hasMesh?: boolean;
                    imageUrl?: string;
                };

                setCameraPosition(site.lat, site.lng, 800, 0, -45, 0);
                setSelectedEntity({
                    id: `niantic-vps-${site.siteId}`,
                    pluginId: "niantic-vps",
                    latitude: site.lat,
                    longitude: site.lng,
                    altitude: 0,
                    heading: 0,
                    timestamp: new Date(),
                    label: site.name,
                    properties: {
                        siteId: site.siteId,
                        hasMesh: site.hasMesh,
                        imageUrl: site.imageUrl,
                    },
                });

                const params = new URLSearchParams(searchParams.toString());
                params.delete("arSite");
                const q = params.toString();
                router.replace(q ? `?${q}` : "/", { scroll: false });
            } catch {
                /* ignore */
            }
        })();
    }, [searchParams, router, setCameraPosition, setSelectedEntity]);

    return null;
}
