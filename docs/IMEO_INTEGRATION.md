# IMEO (UNEP Eye on Methane) integration flow

This document describes how **NOGIET** pulls methane-related data from the **IMEO public API (v2)**, merges it with other satellite feeds (notably Carbon Mapper), and surfaces it on the **live map**.

## References

- Product / map: [Eye on Methane](https://methanedata.unep.org/)
- API documentation (OAS 3.0, **v2.0.0**): [https://methanedata.unep.org/api/docs](https://methanedata.unep.org/api/docs)
- Backend env template: `noiget-backend/.env.example` (`IMEO_API_URL`, `IMEO_API_KEY`, `IMEO_LOG_RESPONSE`)

## API versions (per UNEP docs)

- **V2** — Paths under **`/api/v2/`**. This is the **current, maintained** API; all new integrations should use it.
- **V1** — Older root-style paths (e.g. `/api/plumes`) are **deprecated** and will be removed.

This codebase uses **v2** only, with base URL default  
`https://methanedata.unep.org/api/v2`.

### Troubleshooting: `fetch failed`

If logs show **`[IMEO v2] fetch failed: fetch failed`** with **`code: ENOTFOUND`** (or similar), the hostname cannot be resolved. **Do not use** `https://api.methanedata.unep.org/...` — that subdomain often **does not exist in public DNS**. Use the same origin as the docs: **`https://methanedata.unep.org/api/v2`**. The service rewrites `api.methanedata.unep.org` → `methanedata.unep.org` automatically when present in `IMEO_API_URL`.

## Authentication (v2)

The Swagger UI usually documents **`Authorization: Bearer <JWT>`** after you click **Authorize**.

Many integrations receive a long **API key** string instead of a JWT. Those keys often **only** work as:

```http
X-API-Key: <your-key>
```

**`IMEO_AUTH_MODE`** (default **`bearer`**) controls the header(s) sent. Requests use **`accept: */*`** to match the curl emitted by Swagger.

| `IMEO_AUTH_MODE` | Behavior |
|------------------|----------|
| `bearer` (default) | `Authorization: Bearer <token>` |
| `x-api-key` | `X-API-Key: <token>` |
| `both` | Both headers on every request |
| `auto` | Bearer → on 401/403 → `X-API-Key` |

The credential is stored in **`IMEO_API_KEY`** regardless of scheme.

If you still see **401**, verify the token in the docs **Authorize** dialog and copy it again — the value is **un-prefixed** (no `Bearer `). If you see **403** with an HTML body containing `Just a moment...` / `cloudflare`, the request is being blocked by **Cloudflare WAF** before it ever reaches the IMEO API. The service auto-detects this and logs:

```
[IMEO v2] BLOCKED BY CLOUDFLARE (403). Not an auth problem — your egress IP is being challenged.
```

### Request tagging for UNEP support

Every outbound IMEO request includes **`X-Nigeria-Traffic: 1`** so UNEP technical support (Bernard Nandwa, `unep-methanedata@un.org`) can locate our traffic in Cloudflare logs and create a bypass rule. Do not remove this header without coordinating with UNEP.

### Cloudflare bypass options

1. **IP whitelisting (recommended)** — email **unep-methanedata@un.org** with the public IPs of your server(s) and ask for API access from those IPs.
2. **Outbound proxy** — set `IMEO_PROXY_URL=http://user:pass@host:port` to a clean residential or business proxy. Routed via `undici.ProxyAgent`.
3. **CF clearance cookie (temporary)** — open `https://methanedata.unep.org/api/docs` in a real browser, complete the challenge once, copy the `cf_clearance` (and optionally `__cf_bm`) cookie value, and set `IMEO_COOKIE=cf_clearance=...; __cf_bm=...`. Cookies expire (often 24h) and are tied to your IP, so this is a stop-gap for development only.

## High-level architecture

```mermaid
flowchart LR
  subgraph backend [noiget-backend]
    IMEO[ImeoService]
    CM[CarbonMapperService]
    TR[TropomiService]
    AGG[SatelliteAggregatorService]
    CACHE[(Redis cache)]
    IMEO --> AGG
    CM --> AGG
    TR --> AGG
    AGG --> CACHE
  end
  subgraph frontend [nogiet-frontend]
    HOOK[useSatelliteSources]
    MAP[LiveMap GeoJSON layers]
    HOOK --> MAP
  end
  API[(IMEO HTTPS API v2)] --> IMEO
  AGG --> HOOK
```

### Architectural symmetry with Carbon Mapper

`ImeoService` mirrors `CarbonMapperService` and `EmissionService.getAllSourcesCached` so all providers behave the same way:

| Concern | Carbon Mapper | IMEO |
|---|---|---|
| Cache key helper | `bboxCacheKey(gasType)` | `imeoCacheKey(gasType)` |
| Stale fallback key | — (token cache only) | `imeoStaleKey(gasType)` (7-day) |
| Service-level cache | via `EmissionService.getAllSourcesCached` (30 minutes) | `ImeoService.fetchAllSourcesCached` (30 minutes) |
| In-flight dedupe | `EmissionService.fetchPromise` | `ImeoService.fetchPromise` |
| BBox filter helper | `getSourcesInBBox(all, bbox)` | `getSourcesInBBox(all, bbox)` |
| Per-source detail | `getSourceDetail(name)` | `getSourceDetail(idSource)` |
| Refresh path | aggregator `refreshAllSources` (cache `del`) | `refreshSources(bbox, gas)` |
| Resilience on outage | re-auth on 401, error bubbles | **stale cache fallback** when live fetch fails (Cloudflare blocks, IMEO downtime) |

Practical effect: once IMEO has been fetched **once successfully**, subsequent Cloudflare blocks no longer empty the map — the service serves the **last-known good** result for up to 7 days while logging a `serving STALE cache` warning.

### V2 endpoints

1. **`ImeoService`** (`noiget-backend/src/services/third-party/imeo.service.ts`) wraps the IMEO **V2 Plume Detection** endpoints:

   | Method & path | Purpose | Service method |
   |---|---|---|
   | `GET /api/v2/plumes_w_wo_sources` | All plume detections (paginated) | `fetchSources()` |
   | `GET /api/v2/plumes/{id_source}` | Plumes by MARS source id | `getPlumesBySource(id)` |
   | `GET /api/v2/plumes_last_update` | Last data update timestamp | `getLastUpdate()` |
   | `GET /api/v2/plumes/image/{id_plume}` | Plume satellite image (binary) | `getPlumeImage(id)` |

   The service follows `next` / `next_page_url` / `links.next` pagination if present and accepts arrays, `results`/`data`/`items`/`records`/`plumes`, or GeoJSON envelopes. **It does not** send `bbox` or `country` to IMEO (those are not documented for `/plumes_w_wo_sources`); geographic filtering is applied by the aggregator after normalization.

2. **`SatelliteAggregatorService`** merges IMEO with Carbon Mapper and TROPOMI into **`NormalizedSource`** rows and caches in Redis (30 minutes).
3. **`EmissionService.getSatelliteSources`** serves aggregated features on `GET /api/v1/emissions/satellite/sources`, filtered by viewport `bbox` when provided. **`getSatellitePlumes(sourceId)`** routes IMEO ids (`imeo-…`) to `/api/v2/plumes/{id_source}` and other ids to Carbon Mapper. New backend routes:
   - `GET /api/v1/emissions/satellite/imeo/plume-image/:plumeId` (proxies image bytes)
   - `GET /api/v1/emissions/satellite/imeo/last-update`
4. **`LiveMap`** colors strokes by `provider` (`imeo` = cyan) and shows IMEO attribution in popups/modals.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `IMEO_API_URL` | v2 base including `/api/v2` (default: `https://methanedata.unep.org/api/v2`). Legacy `.../v1` is rewritten to `.../api/v2`; `api.methanedata.unep.org` is rewritten to `methanedata.unep.org`. |
| `IMEO_API_KEY` | Bearer token from the docs **Authorize** flow. |
| `IMEO_LOG_RESPONSE` | When `true`, logs envelope keys + **first raw JSON record** on the server. |
| `IMEO_COUNTRY_FILTER` | ISO 3166-1 alpha-3 code(s) (default **`NGA`**). Comma-separated for several (e.g. `NGA,CMR,NER`). Use `*` or `ALL` to disable and fetch globally. Filtering happens **in-memory** after the global cache, since `/plumes_w_wo_sources` does not accept a country query parameter. |

**Security:** do not commit real tokens; use secrets in production. Rotate any token that leaked.

## IMEO plumes vs Carbon Mapper plumes

| Aspect | Carbon Mapper | IMEO (Eye on Methane) |
|--------|----------------|------------------------|
| **Idea** | Satellite-detected methane **sources** and associated **plume** observations for facilities and regions. | UNEP’s integrated platform: plumes, studies, density/context — aligned with **MARS** and multi-sensor views. |
| **API shape** | JWT + `/sources`, `/plumes` per source. | **v2** list endpoints (we use **`/plumes`** first, then **`/events`**). |
| **In NOGIET** | Full **plume detail** (`/satellite/plumes/:id`) is still **Carbon Mapper–backed**. | IMEO rows are **normalized to map points** (`provider: imeo`) with rates, instrument, dates, and `metadata.imeoResource` = `plume` or `event`. |

They are **similar in purpose** (where methane is seen from space / integrated products) but **not identical**: different instruments, quantification methods, and aggregation rules. Showing **both** on the map (with provider filters) gives analysts complementary views.

## Response handling

The client accepts typical JSON envelopes: arrays, `results` / `data` / `items` / `records`, or GeoJSON `FeatureCollection` / `Feature`, then maps fields into **`NormalizedSource`** (see `imeo.service.ts` for plume-oriented id/rate aliases).

### Seeing the raw payload

- **Server:** `IMEO_LOG_RESPONSE=true` → `[IMEO v2] /plumes envelope keys:` and `[IMEO v2] first raw record:`.
- **Browser (dev):** `[Satellite API] normalized sample (imeo):` after aggregation.

## Operational notes

- Confirm your token works against **`https://methanedata.unep.org/api/v2/plumes`** (or `/events`) with `Authorization: Bearer …`.
- Aggregator cache TTL is **one day**; use satellite **refresh** after changing tokens or IMEO behavior.
