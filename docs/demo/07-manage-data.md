# 07 · Manage Data

> **Source code:** `nogiet-frontend/components/ManageData.tsx`,
> `nogiet-frontend/components/manage-data/*`,
> `noiget-backend/src/repositories/emission.repository.ts`.

The CRUD desk for facilities, ground readings, and per-facility alert
thresholds.

## Screen

A **facility list** on the left, a **facility detail** panel on the right.
Tapping a row opens its detail; the rail shows:

- Name, sector, region, state, LGA, oil block, operator, type, coordinates.
- Editable **alert threshold** (kg/hr) — when set, satellite or ground
  readings exceeding it generate an alert automatically.
- Recent ground readings.
- **Delete** action (Super Admin / Admin only).

Above the list there's a **+ Add Facility** button (modal form), and a
**+ Submit Reading** action that scopes a new ground submission to the
selected facility.

## Workflow

1. **Add a facility** — name, lat/lon, sector, optional state/lga/oilBlock/
   operator/facilityType. Backend persists; the new facility appears on the
   live map immediately (it pushes to all clients via Socket.IO).
2. **Set a threshold** — drives automated alert generation.
3. **Submit a ground reading** — date, methodology (OGI camera, sniffer drone,
   fixed sensor), value, optional coordinates.
4. **Delete a facility** — cascades to associated ground readings (with a
   confirmation modal).

## Workflow on the API

```
POST /api/v1/emissions/facilities          → createFacility()
POST /api/v1/emissions/ground-data         → submitGroundData()
PUT  /api/v1/emissions/facilities/:id/threshold  → updateFacilityThreshold()
DELETE /api/v1/emissions/facilities/:id    → deleteFacility()
```

Every write triggers a `socket.emit('facility:update', ...)` so other open
clients refresh in real time.

## Demo script

> ► *"This is the desk where the regulator manages the facility roster. Add a
> new facility here and it appears on the live map for every other open client
> in real time. Set a threshold per facility and the system starts generating
> alerts automatically when satellites detect emissions above that line."*
