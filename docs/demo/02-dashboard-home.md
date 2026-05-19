# 02 · Dashboard Home

> **Source code:** `nogiet-frontend/components/DashboardHome.tsx`,
> `noiget-backend/src/repositories/emission.repository.ts → getDashboardSummary()`.

## Screen

The Dashboard is the **first impression** of NOGIET — a quick visual answer to
"how much methane is Nigeria emitting this week?".

It has five regions, top to bottom:

1. **KPI strip** (4 cards)
   - Total Facilities — from the database.
   - Satellite-Detected Sources — count of points returned by the active
     satellite providers.
   - Total Emission Rate — sum of all detected emission rates, in the user's
     preferred unit (kg/hr, kg/day, tonnes/year, CO₂e/hr).
   - Alerts This Week — threshold exceedances in the last 7 days.

2. **Emission trend (7 days)** — area chart
   - **Multi-source split**: one stacked area per provider (Carbon Mapper,
     IMEO, TROPOMI), each in its canonical color from the shared `feedColor()`
     palette so the chart matches the live map and the Methane Trends screen.
   - Hovering any day shows per-provider tooltips.
   - Empty state explains "chart will populate as feeds load" instead of
     showing a blank widget.

3. **Top emitters** (left) and **Recent alerts** (right) — two side-by-side cards.
   - Top emitters: top 10 facilities by total ground-reading sum.
   - Recent alerts: latest 5 by `createdAt` with severity badges (red/amber/grey).

4. **Quick actions** — three big buttons that jump straight into the Live Map,
   Alerts, or Manage Data screen.

5. **Data Sources** — connection status for Carbon Mapper, UNEP IMEO, TROPOMI
   (green checkmark when configured + reachable, grey X when not).

## Workflow

- Land on dashboard → scan KPIs → spot a trend → click "View Live Map" to dig in.
- Click a provider chip in the trend chart legend (visual only on this screen) to
  identify which feed dominates.
- Click "View Alerts" if the Alerts This Week number looks suspicious.

## Data flow

```
GET /api/v1/emissions/dashboard-summary
            │
            ▼
EmissionService.getDashboardSummary()
            │
            ▼
EmissionRepository.getDashboardSummary()
            │  - count(facilities)
            │  - count(measurements)
            │  - count(alerts where createdAt >= 7d ago)
            │  - SELECT top 10 facilities by sum(methaneReading)
            │  - SELECT 7-day daily alert totals
            ▼
Returns { totalFacilities, totalMeasurements, alertsThisWeek,
          recentAlerts, topFacilities, dailyTrend }

# Plus, fetched in parallel from satellite aggregator:
SatelliteAggregator.fetchAllSources(NIGERIA_BBOX)
            │
            ▼
Returns NormalizedSource[]  → activeSatelliteSources, totalSatelliteEmissionRate

# Plus, fetched on the FRONTEND from the satellite store (deduped via React Query):
useSatelliteSources(...)
            │
            ▼
Per-day, per-provider buckets fed into the area chart
```

The dashboard relies on the **same satellite store** the live map populates —
React Query dedupes the fetch so opening the dashboard doesn't trigger a second
network call if the user has already visited the map.

## Why the trend chart is split by source

A single line that mashes Carbon Mapper, IMEO and TROPOMI together hides the
*reason* for an emission spike. Splitting by provider lets the analyst answer
"is this real or is one provider just having a noisy week?" in a glance —
because the colors match the map below, mental switching cost is minimal.

## Demo script

> ► *"This is the daily standup view for a regulator. KPIs at the top, a 7-day
> trend split by satellite source so you can see at a glance whether Carbon
> Mapper or UNEP IMEO is driving emissions, top emitters and recent alerts
> side-by-side, and quick actions to jump into the map. Every number you see
> here is traceable to a specific provider — we don't hide where data comes
> from."*
