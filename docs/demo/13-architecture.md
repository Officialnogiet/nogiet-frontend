# 13 · Architecture — under the hood

A short technical reference for the engineering members of the audience. Every
file path below is verified against the running code.

## High-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         NOGIET Frontend                          │
│                                                                  │
│  React 19 + Vite + TypeScript + Tailwind                         │
│  Mapbox GL JS · Recharts · TanStack Query · Zustand              │
│                                                                  │
│  Screens                Components                               │
│   ├ Login               ├ live-map/      (grid, layers, panels)  │
│   ├ Dashboard           ├ methane-trends/(feeds, aggregations)   │
│   ├ Live Map            ├ data-comparison/                       │
│   ├ Methane Trends      ├ manage-data/                           │
│   ├ Data Comparison     ├ alerts/                                │
│   ├ Data Explorer       ├ settings/                              │
│   ├ Manage Data         └ auth/                                  │
│   ├ Alerts                                                       │
│   ├ Field Data                                                   │
│   ├ User Management                                              │
│   └ Settings                                                     │
│                                                                  │
│  REST + WebSocket (Socket.IO) ────────────────┐                  │
└────────────────────────────────────────────────┼─────────────────┘
                                                 │
                                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                         NOGIET Backend                           │
│                                                                  │
│  Node.js + Fastify + TypeScript                                  │
│  Drizzle ORM (Postgres) + ioredis                                │
│                                                                  │
│  Routes                  Services                                │
│   ├ /auth                ├ AuthService                           │
│   ├ /users               ├ UserService                           │
│   ├ /emissions           ├ EmissionService                       │
│   ├ /facilities          ├ NotificationService (email + sms)     │
│   ├ /alerts              ├ CacheService                          │
│   ├ /satellite/...       └ third-party/                          │
│                            ├ CarbonMapperService                 │
│                            ├ ImeoService                         │
│                            ├ TropomiService                      │
│                            └ SatelliteAggregatorService          │
│                                                                  │
│  Background                                                      │
│   ├ CronService (every minute: refresh + threshold alerts)       │
│   └ Socket.IO emitter (alert:new, satellite:update)              │
└──────────────────────────────────────────────────────────────────┘
                  │                                  │
                  ▼                                  ▼
        ┌────────────────────┐             ┌──────────────────┐
        │ Postgres (Aiven)   │             │ Redis            │
        │ - users            │             │ - aggregator     │
        │ - facilities       │             │   cache (24h)    │
        │ - ground_data      │             │ - stale fallback │
        │ - alerts           │             │   (7 days)       │
        │ - geofences        │             └──────────────────┘
        │ - field_subs       │
        └────────────────────┘
                  │
                  ▼
       Cloudflare R2 (S3) for field-data photos
```

## Frontend stack

- **Build:** Vite. ESM-first.
- **UI:** React 19, TypeScript strict, Tailwind 3.
- **Maps:** Mapbox GL JS. Square emissions grid is generated client-side from
  raw satellite points (`components/live-map/emissionGrid.ts`).
- **Charts:** Recharts (composed area + line + bar).
- **State:**
  - **Server state:** TanStack Query. Every read goes through `useSatelliteSources`,
    `useFacilities`, `useAlerts`, `useDashboardSummary`.
  - **Client state:** Zustand persisted to localStorage. Stores: `auth`,
    `dashboard`, `satellite`, `settings`. Persisted state is **versioned** with
    a `migrate` function (currently at v7).
- **Realtime:** Socket.IO client; `useSocket` hook invalidates the right query
  keys on `alert:new` and `satellite:update` events.
- **Routing:** simple enum-based screen switcher (`AuthScreen` /
  `DashboardView`) — there's no react-router because the app is single-page
  with sidebar navigation.

## Backend stack

- **Server:** Fastify. JSON schema validation per route via Zod adapter.
- **DB:** Postgres on Aiven; Drizzle ORM provides typed query builders.
- **Cache:** Redis (ioredis) for satellite payloads with TTL + stale fallback.
- **Auth:** JWT (15-minute access, 7-day refresh, automatic rotation).
- **Email:** Resend (transactional + alerts).
- **SMS:** Termii (Nigerian SMS gateway, optional).
- **Storage:** Cloudflare R2 for field photos (S3-compatible).
- **Socket.IO:** broadcast endpoint for real-time alert + map updates.

## Schemas

Every column is typed in `noiget-backend/src/db/schema.ts`. Migrations live in
`noiget-backend/src/db/migrations/`. There's no production migration runner
inside the app yet — migrations are applied manually with `drizzle-kit push`
during deployments.

## Configuration

All secrets live in `.env` files (see `.env.example`). The backend validates
env on startup via Zod (`src/config/env.ts`); a missing or malformed value
fails fast with a descriptive error.

## Observability

Pino logger with pretty output in dev, JSON in production. Every external
fetch (Carbon Mapper, IMEO, TROPOMI) emits structured logs prefixed by
provider tag for easy grep.

## Where to start reading the code

| Goal | File |
|---|---|
| Understand the shared satellite shape | `noiget-backend/src/types/index.ts` → `NormalizedSource` |
| Understand the live map | `nogiet-frontend/components/LiveMap.tsx` |
| Understand the IMEO ↔ instrument mapping | `nogiet-frontend/components/methane-trends/feeds.ts` |
| Understand the cron job | `noiget-backend/src/services/cron.service.ts` |
| Understand auth | `noiget-backend/src/services/auth.service.ts` |

## Operational checklist

- [ ] `.env` populated with database, JWT secrets, satellite credentials.
- [ ] Postgres reachable, schema migrated.
- [ ] Redis reachable.
- [ ] Carbon Mapper credentials valid.
- [ ] IMEO Bearer token valid AND IP/ traffic allowlisted by UNEP.
- [ ] Resend / Termii API keys (optional, for notifications).
- [ ] Cloudflare R2 bucket reachable (optional, for field photos).
