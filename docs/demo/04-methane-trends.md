# 04 · Methane Trends

> **Source code:** `nogiet-frontend/components/MethaneTrends.tsx`,
> `nogiet-frontend/components/methane-trends/*`.

The Methane Trends screen answers two analytical questions:

1. **"Is methane in Nigeria getting better or worse over time, and which
   satellite is telling that story?"** — the **Long-term Trends** tab.
2. **"How does each Nigerian state compare year over year, broken down by
   data source?"** — the **Annual Statistics** tab.

## Screen

A header bar with three filters:
- **Scope** — currently `Nigeria (all states)`. Drilling into a row from the
  Annual table changes scope to that state's name.
- **Provider** — All / Carbon Mapper / IMEO / TROPOMI.
- **Group by** (Annual tab only) — State / Region / Facility.

Below the header, two tabs:

### Long-term Trends tab

A composed chart with two stacked panels:

- **Top: Methane (kg/hr)** — one solid line per **feed** (provider+instrument)
  with a dashed 12-month rolling average alongside.
- **Bottom: Reading coverage (%)** — bar chart showing how many observations
  feed each month (low coverage = noisy reading).

Above the chart, a **grouped legend**:

```
Sources           [Reset]
Carbon Mapper:    EMIT  ·  AVIRIS-NG
IMEO (UNEP):      EnMAP  ·  Sentinel-2  ·  GHGSat  ·  PRISMA  ·  MethaneSAT
TROPOMI:          TROPOMI
```

Each chip is clickable to mute/show the corresponding line. The **Reset** link
restores everything. Colors here match the live map exactly.

### Annual Statistics tab

A sortable, downloadable table:

| State | Region | Geo Location | 2020 Avg | 2021 Avg | … |
|---|---|---|---|---|---|
| Nigeria | — | 8.3°, 7.2° | 12.5 | 13.1 (+5%) | … |
| Bayelsa | South South | 4.7°, 6.1° | 18.0 | 17.4 (-3%) | … |
| Lagos | South West | 6.5°, 3.4° | 8.2 | 9.0 (+10%) | … |
| … | | | | | |

Each row is **expandable** — clicking the chevron reveals a per-feed sub-table:

```
Source · Instrument            2020   2021   2022   2023   2024   Total Obs
Carbon Mapper
   ● EMIT                       …     …      …      …      …      …
   ● AVIRIS-NG                  …     …      …      …      …      …
IMEO instruments
   ● EnMAP                      …     …      …      …      …      …
   ● Sentinel-2                 …     …      …      …      …      …
TROPOMI
   ● TROPOMI                    …     …      …      …      …      …
```

A **Download CSV** button exports the entire table including the per-feed and
per-region breakdown — analysts can drop this straight into Excel or a regulator
report.

The **Geo Location** column is a clickable Google Maps link to the centroid of
that group's observations.

The **Details** button per row jumps to Long-term Trends scoped to that state.

## Group-by modes

| Mode | What it does |
|---|---|
| **State** | Default. One row per Nigerian state. |
| **Region** | One row per geopolitical zone (South South, North Central, etc.) — six rows total. |
| **Facility** | One row per registered facility, with each satellite plume **bound to its nearest facility within 30 km** so analysts can see which operator owns the activity. |

## Loading states

When the satellite store is still loading, the screen shows a **centered
preloader** with the text **"Fetching satellite data…"** and an explanation that
points are being resolved to states and facilities. As soon as data lands, the
chart appears; if a refetch happens later, a small inline spinner sits next to
the tab buttons (no jarring layout shift).

## Why split IMEO into multiple lines

UNEP IMEO is not a satellite, it's an **aggregator** — they re-publish plumes
from EnMAP, Sentinel-2, GHGSat, MethaneSAT, etc. Each instrument has its own
revisit cadence and detection limit. Lumping them into one "IMEO" line is
analytically misleading. The chart gives each its own series; the colors are
deterministic (hashed off the instrument name) so EnMAP is always the same hue
on every screen.

## Data flow

```
useSatelliteSources(...)        ← React Query
         │
         ▼
useSatelliteStore.sources       ← Zustand
         │
         ▼
attachStateNames(...)           ← point-in-polygon against Nigeria states GeoJSON
         │
         ▼
attachNearestFacility(...)      ← Haversine within 30 km
         │
         ▼
buildFeedSeries(rows, range)    ← group by feed (provider+instrument)
buildAnnualTable(rows, years,
                 mode, label)   ← group by state/region/facility
         │
         ▼
TrendsChart + AnnualStatisticsTable
```

## Demo script

> ► *"This is where you go to answer 'has it gotten better?'. The legend is
> grouped by provider — Carbon Mapper has its instruments listed under it, IMEO
> has all its underlying satellites listed under it. Click any one to mute its
> line. Switch to Annual Statistics, group by state — every Nigerian state with
> per-year averages and the year-over-year change. Expand any row to see the
> per-source breakdown. Click Download CSV and you've got the data ready for a
> Ministry brief."*
