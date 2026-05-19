# 06 · Data Explorer (Data Tabs)

> **Source code:** `nogiet-frontend/components/DataTabs.tsx`,
> `noiget-backend/src/services/emission.service.ts`.

A tabular browser for analysts who prefer spreadsheets to maps. Five tabs, each
backed by a dedicated query.

## Tabs

| Tab | What it shows |
|---|---|
| **Satellite Sources** | All current points from Carbon Mapper, IMEO, TROPOMI in one paginated, sortable, filterable table. Provider chip per row. |
| **Individual Sources** | Each emission source with full attributes (sector, instrument, persistence, plume count, first/last detected). |
| **Emission Rates** | Sources ranked by kg/hr output — the "leaderboard of leaks". |
| **Cumulative Totals** | Total emissions per facility over the selected time window. |
| **Aggregated Averages** | Average emission per region and per operator. |

Every table supports:

- **Free-text search** at the top of the tab.
- **Column sort** by clicking a header.
- **Pagination** with 20 rows per page (configurable).
- **CSV export** for the active view.

## Workflow

1. Pick a tab.
2. Search / filter / sort.
3. Export CSV for downstream use.

## Why this screen exists

Not every analyst is a map person. Engineers, statisticians, and regulators
who need to slice data for offline analysis live in this screen.

## Data flow

```
GET /api/v1/emissions/aggregations
GET /api/v1/emissions/satellite/sources
            │
            ▼
EmissionService → aggregator + repository
            │
            ▼
Returns the structured tables consumed by DataTabs.tsx
```

## Demo script

> ► *"Some users prefer rows and columns to maps. This is the same data —
> Carbon Mapper, IMEO, TROPOMI — but in five tabs ready to filter, sort, and
> export. Click any header to sort, search the box at the top, hit Download CSV
> when you're done."*
