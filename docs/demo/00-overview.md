# 00 · Overview — what NOGIET is and why it matters

## In one sentence

NOGIET is a **government-grade methane emissions tracker** for Nigeria's oil &
gas sector that combines **satellite plume detections** from three independent
providers with **ground-truth measurements** submitted by facility operators,
then surfaces actionable insight through a single map, dashboard, and alert system.

## The problem

Methane is the second most powerful driver of climate change after CO₂, with
human activity contributing roughly a third of current warming. Nigeria's oil &
gas sector is one of West Africa's largest methane sources, but the country has
historically lacked a **single source of truth** for emissions — multiple
agencies, multiple datasets, no shared canvas.

NOGIET is that canvas.

## Who uses it

| Role | Primary use |
|---|---|
| **Super Admin (NOGIET HQ)** | Configures the platform, manages users and providers |
| **Admin (regulator desk officer)** | Triages alerts, validates field reports, generates regional briefs |
| **Member (analyst)** | Browses the map, runs comparisons, exports data for studies |
| **Facility Owner (operator)** | Submits ground-truth readings via the mobile-friendly Field Data form |

Role permissions are enforced both in the UI (sidebar entries hide for
unauthorised roles) and in the backend (every API route validates the JWT and
the role before returning data).

## What success looks like

A regulator opens NOGIET in the morning, sees:

1. **Dashboard:** total facilities, active satellite sources today, alerts this
   week, with a 7-day trend split by data source.
2. **Live Map:** Nigeria's oil & gas footprint with a colored square grid showing
   methane intensity, individual plume detections from each satellite feed, and
   any facilities exceeding their alert threshold flashing.
3. **Alerts:** prioritised by severity; one click to drill into the offending
   facility, see the satellite image of the plume, and dispatch a field team.
4. **Methane Trends:** answers "is this getting better or worse?" with multi-year
   per-source trend lines and annual statistics per state.

All of this without leaving the browser, without spreadsheet juggling, and with
**every number traceable back to a specific provider + instrument + date**.

## Three things to remember during the demo

1. **The map is the centre of gravity.** Everything else exists to support
   making the map either richer (overlays, filters) or actionable (alerts,
   reports).
2. **Provider transparency is non-negotiable.** Every plume on the map, every
   line on the trends chart, every row in the annual table is **colored and
   labelled by the satellite that detected it**. We never hide where data
   came from.
3. **Ground truth matters.** Satellites are great at scale but can miss small
   leaks. The Field Data form lets operators report what they measure on-site;
   the Data Comparison screen reconciles the two views.

## What's deliberately NOT in scope (yet)

- **Real-time alerting** — alerts fire on an hourly cron, not the second a
  satellite detects a plume.
- **Predictive modelling** — the platform shows what *is* happening, not what
  *will* happen. Models can be added on top later.
- **Multi-country deployment** — the Nigeria boundary, oil-block, and pipeline
  data are baked in. The architecture is portable but not multi-tenant today.

## Architecture in one diagram

```
                    ┌──────────────────────────────┐
                    │   Carbon Mapper API (JWT)    │
                    │   IMEO V2 API (Bearer)       │
                    │   TROPOMI / Sentinel-5P      │
                    └──────────────┬───────────────┘
                                   │ pull every cron tick
                                   ▼
                  ┌────────────────────────────────────┐
                  │  Backend — Node.js (Fastify)       │
                  │  · SatelliteAggregatorService      │
                  │  · Per-provider service classes    │
                  │  · Redis cache + stale fallback    │
                  │  · Postgres (facilities, alerts,   │
                  │    ground readings, geofences)     │
                  └────────────────┬───────────────────┘
                                   │ REST + Socket.IO
                                   ▼
                ┌──────────────────────────────────────┐
                │  Frontend — React + Vite + Mapbox    │
                │  · Live Map (square grid + points)   │
                │  · Methane Trends (per-feed charts)  │
                │  · Dashboard, Alerts, Manage Data    │
                │  · Field Data PWA (offline queue)    │
                └──────────────────────────────────────┘
```

For the technical deep-dive see [13-architecture.md](./13-architecture.md).
