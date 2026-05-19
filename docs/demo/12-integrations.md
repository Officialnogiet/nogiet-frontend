# 12 · Integrations — Carbon Mapper, IMEO, TROPOMI

> **Source code:** `noiget-backend/src/services/third-party/*`.
> Detailed IMEO writeup: [../IMEO_INTEGRATION.md](../IMEO_INTEGRATION.md).

NOGIET pulls satellite methane data from three independent providers and
reconciles them into a single normalised feed.

## Provider matrix

| Provider | Auth | Endpoint | What we get |
|---|---|---|---|
| **Carbon Mapper** | JWT (`/token/pair`, refresh on 401) | `https://api.carbonmapper.org/api/v1/catalog/sources` | Per-source plume catalogue with `instrument` (EMIT, AVIRIS-NG, AVIRIS-3, ASU GAO). |
| **UNEP IMEO** | Bearer token from `https://methanedata.unep.org/api/docs` | `/api/v2/plumes_w_wo_sources`, `/api/v2/plumes/{id_source}`, `/api/v2/plumes_last_update`, `/api/v2/plumes/image/{id_plume}` | Aggregated plume catalogue spanning EnMAP, Sentinel-2, Sentinel-5P, GHGSat, PRISMA, MethaneSAT and more. |
| **TROPOMI / Sentinel-5P** | (placeholder; will use Copernicus Data Space credentials) | Sentinel-5P L2 CH4 product | Atmospheric column data (currently a stub returning `[]`; ready for activation). |

## Service layout

```
noiget-backend/src/services/third-party/
  carbon-mapper.service.ts          ← JWT auth + /catalog/sources fetch
  imeo.service.ts                   ← Bearer auth + V2 endpoints + retries
  tropomi.service.ts                ← stub
  satellite-aggregator.service.ts   ← runs all three in parallel + merges
```

Each service exposes `fetchAllSources(filters)` returning `NormalizedSource[]`.

## Normalisation

```ts
interface NormalizedSource {
  id: string;            // "cm-<source_name>" or "imeo-<id_plume>" etc.
  name: string;
  provider: 'carbon_mapper' | 'imeo' | 'tropomi';
  instrument: string;    // "EMIT", "EnMAP - DLR", "Sentinel-2", …
  latitude: number;
  longitude: number;
  emissionRate: number;  // kg/hr
  gas: string;           // 'CH4'
  sector: string;
  persistence: number;
  plumeCount: number;
  firstDetected: string;
  lastDetected: string;
  metadata: {
    iso3cd?: string;
    plumeImageUrl?: string;
    emissionUncertainty?: number;
    // … additional provider-specific fields
  };
}
```

The shared shape lets the frontend treat every provider identically while still
preserving instrument-level granularity through `metadata` and the dedicated
`instrument` field.

## Caching strategy

| Layer | TTL | Where |
|---|---|---|
| Per-provider raw fetch | none (in-memory dedupe per request) | service classes |
| Normalised aggregated cache | 24 hours | Redis key `nogiet:imeo:plumes:CH4`, `nogiet:cm:plumes:CH4`, etc. |
| Stale fallback | 7 days | Redis key `nogiet:imeo:plumes:CH4:stale` |

If a live fetch fails (Cloudflare 403, IMEO downtime), the service serves the
**stale fallback** so the map never goes blank.

## Cloudflare allowlist

UNEP put NOGIET behind Cloudflare's bot protection. Our backend tags every IMEO
request with **`X-Nigeria-Traffic: 1`** (per Bernard Nandwa at UNEP) so they can
allowlist us in their CF rules. See [../IMEO_INTEGRATION.md](../IMEO_INTEGRATION.md)
for the full troubleshooting playbook.

## Demo script

> ► *"NOGIET integrates three independent satellite providers — Carbon Mapper,
> UNEP IMEO, TROPOMI. We don't pick a winner; we show all three side-by-side,
> color-coded by source. IMEO is special because it's an aggregator that
> re-publishes data from many satellites — we expose every underlying
> instrument so you can see exactly which sensor caught which plume. We cache
> for 24 hours, fall back to a 7-day stale copy if the upstream is down, so
> the map never goes blank during a network blip."*
