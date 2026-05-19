# 03 · Live Map — the crown jewel

> **Source code:** `nogiet-frontend/components/LiveMap.tsx`,
> `nogiet-frontend/components/live-map/*`,
> `noiget-backend/src/services/third-party/satellite-aggregator.service.ts`.

The Live Map is where most of the analytical work happens. A regulator can
spend their entire day here.

## Screen

```
┌──────────────────────────────────────────────────────────────────────┐
│  [search bar]                                                        │
│                                                                      │
│  [alerts]    Mapbox canvas — Nigeria + viewport          [Layers]    │
│                                                          [Info]      │
│                                                                      │
│              · square emissions grid (ppb-themed)                    │
│              · satellite plume markers (colored by source)           │
│              · facility markers (teal squares with reading count)    │
│              · oil block + state outlines (toggleable)               │
│                                                                      │
│  ┌──────────────────────┐                                            │
│  │ Currently Showing    │                              [Source key?] │
│  │ Source:    All ...   │                                            │
│  │ Statistic: Maximum   │                                            │
│  │ Time:      Last 7 d  │                                            │
│  │ Sources:   EnMAP 12… │                                            │
│  └──────────────────────┘                                            │
│  [Emission Sources card]    [Plumes Detected card]                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Key UI elements

| Element | What it does |
|---|---|
| **Square emissions grid** | Background ppb-themed grid built from every visible point. Cells colored by aggregated emission rate, with a thicker dark border for cells exceeding the alert threshold. Click a cell to zoom in. |
| **Satellite plume markers** | One dot per detected source, **fill color = data source** (Carbon Mapper teal, each IMEO instrument its own hashed color, TROPOMI violet). Halo size = plume count, halo brightness = emission rate. |
| **Facility markers** | Teal building icons with a numeric badge for measurement count. Click to see ground-reading history. |
| **Search bar** | Free-text search across facility names, sectors, source names. |
| **Alerts button** (left) | Pops a panel of unread alerts, with a count badge. |
| **Layers button** (right, top) | Toggles state boundaries, LGAs, oil blocks, pipelines, satellite imagery basemap, emission grid. |
| **Info button** (right, top, just below Layers) | Opens the **grid legend** — see below. |
| **Source legend hint** (right, bottom) | Floating "?" button. Opens the **Source Legend** showing every active source/instrument and its color. |
| **Currently Showing card** (left, bottom) | Shows the active grid configuration: source(s), statistic, time window, instrument breakdown. |
| **Emission Sources / Plumes Detected** | Two small KPI cards in the bottom-left summarising what's visible. |

## The grid legend (Info icon, top-right)

A nested **Sources tree** — provider checkboxes with **per-instrument
sub-checkboxes** underneath:

```
Sources                     [Select all | Clear all]
☑ ● Carbon Mapper               142
   ☑ ● EMIT                       88
   ☑ ● AVIRIS-NG                  54
☑ ● IMEO (UNEP)                 264
   ☑ ● EnMAP — EnMAP - DLR       124
   ☑ ● Sentinel-2                 87
   ☑ ● GHGSat                     31
   ☑ ● PRISMA                     15
   ☑ ● MethaneSAT                  7
☑ ● TROPOMI                      68
```

- Provider checkbox toggles the whole feed; a checkbox shows the **indeterminate**
  state when only some instruments under it are enabled.
- Per-instrument sub-checkbox lets the user focus on a single satellite.
- **Removing a source from the legend removes it from the entire map** — both
  the grid AND the individual plume markers (filter parity).

## The source legend (Help icon, bottom-right)

A passive reference: shows every provider and instrument currently visible on
the map with its **swatch color**. Use this when the user asks "what does that
purple dot mean?". Same color palette as the Methane Trends chart so the user
never has to translate between screens.

## Workflow

1. Land on map → see Nigeria with the colored grid.
2. Open the **Info** legend → narrow sources to just IMEO + EnMAP.
3. Click a hot grid cell → map zooms in; individual EnMAP plumes resolve.
4. Click a plume marker → popup with name, sector, emission rate, plume count.
   Click "Expand" → full detail modal with the satellite plume image.
5. Use **Layers** to toggle oil blocks → see which lease the plume sits on.
6. If the plume needs investigation, the Alerts panel surfaces existing alerts
   for that source.

## Data flow

```
React Query fetch on load:
GET /api/v1/emissions/satellite/sources?bbox=3,4,15,14&gasType=CH4
         │
         ▼
EmissionService.getSatelliteSources()
         │
         ▼
SatelliteAggregator.fetchAllSources()
         │
         │  In parallel:
         ▼
┌────────────────┐  ┌──────────────────┐  ┌────────────────┐
│ Carbon Mapper  │  │ IMEO (UNEP)      │  │ TROPOMI        │
│ JWT → JSON     │  │ Bearer →          │  │ stub           │
│ /catalog/      │  │ /api/v2/         │  │ (placeholder)  │
│  sources       │  │  plumes_w_wo_…   │  │                │
└────────────────┘  └──────────────────┘  └────────────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                            ▼
                  Normalized to NormalizedSource[]
                            │
                            ▼
                  Redis cache (24h, plus 7-day stale fallback)
                            │
                            ▼
                  Frontend useSatelliteStore (Zustand) populated
                            │
                            ▼
                  Mapbox source `satellite-sources` updated
                            │
                            ▼
                  Three Mapbox layers rendered:
                   - emission-grid-fill (ppb cells)
                   - satellite-glow (halo)
                   - satellite-point (per-source colored dots)
```

## Color encoding cheat sheet

| What | Color from |
|---|---|
| Plume marker fill | `feedColor(provider, instrument)` — Carbon Mapper teal, IMEO instrument-hashed, TROPOMI violet |
| Plume halo size | Plume count (more plumes = bigger halo) |
| Plume halo opacity | Emission rate (hotter source = brighter halo) |
| Grid cell fill | Methane intensity binned to the IMEO ppb scale (0-1970, 1970-2000, …, 2080+) |
| Grid cell border | Thick dark border = exceeds alert threshold |

## Demo script

> ► *"This is the heart of NOGIET. The colored squares behind everything is the
> emissions grid — darker means more methane. Sitting on top, you have one dot
> per detected plume, **colored by the satellite that detected it**. UNEP IMEO
> is an aggregator, so they actually return data from many satellites — EnMAP,
> Sentinel-2, GHGSat — each gets its own color. Click any source on/off in the
> legend on the right and the map updates immediately. The little ? button in
> the bottom-right gives the audience a colour key without having to open the
> filter modal."*
