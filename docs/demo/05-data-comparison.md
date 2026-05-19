# 05 · Data Comparison

> **Source code:** `nogiet-frontend/components/DataComparison.tsx`,
> `nogiet-frontend/components/data-comparison/*`,
> `noiget-backend/src/services/emission.service.ts → getComparisonData()`.

## Screen

A facility-by-facility "ground truth vs satellite" reconciliation tool.

The user picks a facility from a dropdown; the page splits into:

- **Left rail** — facility metadata, ground submission form, and a list of
  ground readings + nearby satellite sources (each can be excluded with a
  toggle).
- **Centre** — a bar chart that compares **monthly ground measurements** vs
  **monthly satellite emission rates**.
- **Top of centre** — a **comparison mode toggle**:
  - **Closest match** — picks the single satellite source nearest to the
    facility coordinates.
  - **Area sources** — includes every satellite source within a configurable
    radius (default 300 km).

## Workflow

1. Pick a facility.
2. Set the comparison mode + radius.
3. The left rail lists every nearby satellite source with its distance — uncheck
   any that look unrelated (e.g. a different operator next door).
4. The chart updates in real time to reflect the active selection.
5. **Add ground reading** — collapsible form that submits a new methane reading
   for the facility (date, methodology, latitude/longitude).
6. **Export** — generate a PDF or CSV for the comparison.

## Why this screen exists

Satellites are great at scale but can miss small leaks; ground sensors catch
fine detail but are sparse. NOGIET treats both as first-class citizens. The
Comparison screen is where a regulator validates a satellite alert against a
field reading, or vice versa.

## Data flow

```
GET /api/v1/emissions/comparison/:facilityId?mode=nearest&maxDistance=300
            │
            ▼
EmissionService.getComparisonData()
            │
            ├── Repository: ground readings for the facility
            │
            └── SatelliteAggregator: nearby sources within bbox
                            │
                            ▼
                  Returns { facility, groundData, satelliteData,
                            allNearbySources, comparisonMeta }
                            │
                            ▼
ComparisonChart bucket by month → render bars
```

## Demo script

> ► *"Satellites can't see everything. Here's how we reconcile a facility's
> ground submissions against what the satellites picked up nearby. Pick a
> facility, choose nearest match or area mode, and uncheck anything you want to
> ignore. The chart re-bins immediately. Hit export and you've got a regulator
> report."*
