# WorldWideView AR Companion (Unity + Niantic Spatial)

Unity 6000.0.74f1 project with [Niantic Spatial SDK](https://nianticspatial.com/docs/nsdk/setup/) for field AR at VPS sites linked from the web globe.

## Prerequisites

- Unity Hub with **6000.0.74f1**
- Niantic Spatial business account and service API key (configured on the WWV server, not in Unity)
- WorldWideView running locally (`bun dev`) with `NIANTIC_SPATIAL_API_KEY` set

## Setup

1. Open this folder (`apps/wwv-ar-unity`) as a Unity project.
2. **Package Manager** → Add package from git URL: `https://github.com/nianticspatial/nsdk-library-upm.git`
3. Follow [NSDK setup](https://nianticspatial.com/docs/nsdk/setup/) (AR Session, XR Origin, authenticate via NSDK Settings).
4. Set **WWV Base URL** on `Assets/WWV/WWVConfig.cs` (default `http://localhost:3000`).
5. Set **Upload Secret** to match `NIANTIC_MESH_UPLOAD_SECRET` or `WWV_BRIDGE_TOKEN` in WWV `.env.local`.

## WWV integration

| Script | Role |
|--------|------|
| `WwvConfig.cs` | Base URL and upload secret |
| `WwvTokenClient.cs` | Fetches JWT from `GET /api/niantic/token` (paste session cookie in editor) |
| `WwvMeshExporter.cs` | POST GLB to `/api/niantic/mesh` after mesh download |
| `WwvCoverageExporter.cs` | POST GeoJSON to `/api/niantic/coverage/cache` |
| `WwvDeepLinkHandler.cs` | Opens `?arSite={id}` on device |

## Deep links

- Web: `https://your-host/?arSite={siteId}`
- Custom scheme: `worldwideview://ar?siteId={siteId}` (register on mobile builds)

## Mesh pipeline

1. Localize with NSDK at a VPS Site.
2. Download mesh via `LocationMeshManager`.
3. Run **WWV → Export Mesh** (context menu on `WwvMeshExporter`) to upload GLB.
4. Enable **Niantic Site Meshes** layer on the web globe.

## CI

Unity builds are manual; not part of `bun test` / `bun build`.
