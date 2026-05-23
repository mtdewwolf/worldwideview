# Niantic Spatial Integration

WorldWideView integrates [Niantic Spatial](https://nianticspatial.com/) for VPS site coverage on the globe and an optional Unity AR companion. NSDK does not run in the browser; the web app uses server proxies and cached data.

## Quick start (local)

1. Add to `.env.local`:
   ```bash
   NIANTIC_SPATIAL_API_KEY=your_service_account_key
   NIANTIC_SPATIAL_USE_FIXTURES=true   # optional: skip live API for dev
   NIANTIC_MESH_UPLOAD_SECRET=your_random_secret
   WWV_APP_URL=http://localhost:3000
   ```
2. Sync the database schema (local dev uses `db push`, not `migrate deploy`):
   ```bash
   bunx dotenv-cli -c -- bunx prisma db push
   ```
   Or start the app — `bun dev` runs this automatically via `predev`.
3. `bun dev` — plugins sync from `local-plugins/`.
4. Enable layers **Niantic VPS Sites** and **Niantic Site Meshes** in the layer panel.
5. With fixtures, sites appear near San Francisco and London (`public/e2e-fixtures/niantic-coverage.json`).

## Architecture

| Component | Path |
|-----------|------|
| Token proxy | `POST` identity via `src/lib/niantic/spatialIdentity.ts` |
| API routes | `src/app/api/niantic/*` |
| VPS plugin | `local-plugins/wwv-plugin-niantic-vps` |
| Mesh plugin | `local-plugins/wwv-plugin-niantic-mesh` (`getGlobeComponent`) |
| UI extension | `local-plugins/wwv-plugin-niantic-ui` |
| Seeder | `local-seeders/community/niantic-vps` |
| Unity app | `apps/wwv-ar-unity` |
| ADR | `docs/architecture/decisions/adr-0004-niantic-spatial-integration.md` |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/niantic/status` | `{ enabled: boolean }` |
| GET | `/api/niantic/token` | Short-lived JWT (auth required when enabled) |
| GET | `/api/niantic/coverage?lat=&lng=&radiusM=` | GeoJSON FeatureCollection |
| POST | `/api/niantic/coverage/cache` | Ingest coverage (auth or upload secret) |
| GET | `/api/niantic/sites/{siteId}` | Single site metadata |
| GET | `/api/niantic/mesh/{siteId}` | GLB binary |
| POST | `/api/niantic/mesh` | Upload GLB (`multipart/form-data`) |

## Data engine

```bash
bun dev:all   # starts wwv-data-engine with local-seeders mounted
```

Seeder polls `WWV_APP_URL/api/niantic/coverage` every 60s (configurable via `NIANTIC_VPS_POLL_MS`).

## Unity companion

See [apps/wwv-ar-unity/README.md](../../apps/wwv-ar-unity/README.md).

1. Open project in Unity 6000.0.74f1.
2. Install NSDK from git URL in `Packages/manifest.json`.
3. Configure `WwvConfig` asset with WWV URL and upload secret.
4. Export coverage/mesh to WWV via context menu scripts.

## Deep links

- Web: `https://your-host/?arSite={siteId}`
- Custom: `worldwideview://ar?siteId={siteId}`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `P3005` on `prisma migrate deploy` | Local DB was created with `db push`, not migrations. Use `bunx dotenv-cli -c -- bunx prisma db push` instead (same as `bun dev` predev). |
| No sites on globe | Set `NIANTIC_SPATIAL_USE_FIXTURES=true` or POST coverage cache from Unity |
| `/api/niantic/status` false | Set `NIANTIC_SPATIAL_API_KEY` on local/cloud edition |
| Mesh not visible | Upload GLB, enable **Niantic Site Meshes**, select site with `hasMesh` |
| Seeder empty | Ensure WWV is reachable at `WWV_APP_URL` from Docker (`host.docker.internal:3000`) |

### P3005 — database schema is not empty

WorldWideView local dev syncs Postgres with **`prisma db push`** ([`scripts/safe-db-push.mjs`](../../scripts/safe-db-push.mjs)), not `migrate deploy`. If your database already has tables but no `_prisma_migrations` history, `migrate deploy` fails with P3005.

**Local fix (recommended):**

```bash
bunx dotenv-cli -c -- bunx prisma db push
```

**Production / migration history (only if you manage deploys via migrations):**

```bash
bunx prisma migrate resolve --applied 20260509061229_init
bunx prisma migrate deploy
```

Only baseline if the live schema already matches the init migration; otherwise align schema first.
