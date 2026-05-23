# ADR-0004: Niantic Spatial Integration

## Status
Accepted

## Date
2026-05-22

## Context

WorldWideView is a browser-based Cesium globe. Niantic Spatial (NSDK) targets Unity/Swift/Kotlin AR runtimes. There is no official web SDK. We still need VPS site intelligence on the globe and an AR handoff path for field use.

## Decision

1. **Server-only secrets** — `NIANTIC_SPATIAL_API_KEY` stays on the Next.js server and data engine container. Clients receive short-lived JWTs from `/api/niantic/token` after WWV authentication.
2. **Coverage via WWV cache (spike B)** — Public HTTP VPS coverage is not available for Node. Coverage is served from PostgreSQL (`NianticSiteCache`), dev fixtures, and POST ingest from Unity (`/api/niantic/coverage/cache`).
3. **Mesh bridge** — Meshes are uploaded as GLB from the Unity companion (`apps/wwv-ar-unity/`) to `/api/niantic/mesh`, stored under `data/niantic-meshes/`, rendered via plugin `getGlobeComponent()` using ECEF placement at site lat/lng.
4. **Plugin boundaries** — `niantic-vps` (billboards), `niantic-mesh` (Cesium models), `niantic-ui` (sidebar + AR deep links). No NSDK code in core `GlobeView`.

## Transform assumptions (mesh pilot)

- Site anchor: WGS84 `lat`/`lng`, optional `alt` meters (default 0).
- GLB is authored in local AR space at the Site; WWV applies `Transforms.eastNorthUpToFixedFrame` at anchor with identity heading until a per-site `headingDeg` is stored in metadata.

## Consequences

- Operators must export coverage from Unity or seed fixtures until Niantic documents server-side coverage HTTP.
- Mesh redistribution must comply with [Niantic Business Terms](https://www.nianticspatial.com/terms-business).
- Demo edition disables Niantic features (`isNianticSpatialEnabled`).
