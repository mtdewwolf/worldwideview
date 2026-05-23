# ADR-0003: Client-Side Marketplace Sync as Plugin Boot Loader

## Status
Accepted

## Date
2026-05-22

## Context

WorldWideView loads installed plugins at runtime via dynamic ES module imports (`loadPluginFromManifest`). Documentation and several unused modules described an older boot path:

- `AppShell` iterating `pluginRegistry.getAll()` for built-in plugins
- `InstalledPluginsLoader` reading PostgreSQL on the server and registering plugins directly

In practice, `pluginRegistry` was only populated by GeoJSON dynamic imports, the registry loop in `AppShell` was a no-op, and `InstalledPluginsLoader` was never imported. Marketplace plugins were loaded client-side by `useMarketplaceSync` calling `GET /api/marketplace/load`, but non-demo installs never auto-enabled loaded plugins.

## Decision

1. **Delete** `InstalledPluginsLoader` and the dead `AppShell` → `pluginRegistry.getAll()` boot loop.
2. **Canonical boot chain:**
   - `AppShell` → `pluginManager.init()` + `injectHostGlobals()` → sets `hostReady`
   - `useMarketplaceSync(hostReady)` → `GET /api/marketplace/load` (seeds defaults server-side) → `pluginManager.loadFromManifest()`
   - Enable plugins unless disabled in DB (`/api/marketplace/disabled-builtins`) or demo env restricts defaults
   - GeoJSON imports → `DataBus` `dynamicPluginCreate` → `PluginManager` + `PluginRegistry`
3. **Keep** `PluginRegistry` for dynamic client-created plugins only.

## Consequences

**Easier:** Single documented loader path; plugins auto-enable on fresh installs; less dead code.

**Harder:** Plugin boot depends on client fetch + auth for marketplace load; server-side-only boot without a browser session is not supported (acceptable for this SPA architecture).
