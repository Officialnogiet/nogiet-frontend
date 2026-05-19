# NOGIET Feature Tracker

> Tracks all features from the client blueprint. Updated as each feature is implemented.

## Legend

- [x] Complete
- [ ] Planned / Not Started

---

## Already Implemented (Pre-existing)

- [x] Interactive Mapbox map with zoom, pan, click
- [x] Carbon Mapper satellite data integration
- [x] Ground-truth measurement submission and comparison
- [x] JWT authentication with roles (super_admin, admin, regulator, facility_owner, viewer, member)
- [x] Role-based permissions (10 permissions across 6 roles)
- [x] Email alerts via Resend
- [x] SMS alerts via Termii
- [x] Real-time updates via Socket.IO
- [x] File uploads to Cloudflare R2
- [x] Basic filter panel (sector, instrument, gas type, emission ranges)
- [x] PDF export (jsPDF)
- [x] CSV export
- [x] Dark/light mode toggle
- [x] Rate limiting (100 req/min)
- [x] Swagger API docs

---

## Phase 1: Core Data and Satellite Foundation

- [x] **1.1 Extended Facility Model** — Added state, LGA, oilBlock, operator, facilityType, alertThreshold fields to facilities table
- [x] **1.2 Multi-Satellite Data Integration** — Carbon Mapper, IMEO, TROPOMI services + satellite aggregator with normalized API (MethaneSAT removed — no access)
- [x] **1.3 Unit Conversion System** — Dynamic conversion between kg/hr, kg/day, tonnes/year, CO2e/hr with global selector
- [x] **1.4 Spatial Filtering and Search** — Backend filter params + frontend cascading dropdowns for state, LGA, oil block, operator, facility type
- [x] **1.5 Data Tabs Interface** — 5 searchable tabs: Satellite Sources, Individual Sources, Emission Rates, Cumulative Totals, Aggregated Averages

## Phase 2: Map Enhancements

- [x] **2.1 Layer Toggling System** — GeoJSON layers for Nigerian states, LGAs, oil blocks, pipelines, emission hotspots with toggle panel
- [x] **2.2 Geofencing Capability** — Mapbox GL Draw for polygon/circle drawing, geofences table, CRUD, intersection-based alerts
- [x] **2.3 Enhanced Interactive Popups** — Hover: name, latest rate, cumulative, trend. Click: full metrics, charts, multi-source, operator info

## Phase 3: Dashboard and Exports

- [x] **3.1 Modular Dashboard** — KPI cards, trend charts, facility ranking tables, ground vs satellite summary
- [x] **3.2 Full Export Formats** — PNG, JPG, PowerPoint, Excel, CSV, PDF with regulatory metadata and export modal
- [x] **3.3 Enhanced Alert Thresholds** — Per-facility configurable thresholds, cron job monitoring, < 1 min alert delivery

## Phase 4: PWA, Offline, and Field Data

- [x] **4.1 Progressive Web App** — vite-plugin-pwa, manifest, icons, install prompt, responsive design
- [x] **4.2 Offline Access and Caching** — Service Worker caching, IndexedDB storage, offline banner, background sync
- [x] **4.3 Field Data Collection Form** — Mobile-optimized form, facility_owner role, GPS/camera, offline queue

## Infrastructure (Not Code — Deployment Tasks)

- [ ] Cloudflare WAF and DDoS protection
- [ ] HTTPS/TLS encryption
- [ ] Automated database backups
- [ ] Horizontal scaling for 1,000-3,000 MAUs
- [ ] 99.9% uptime monitoring and alerting

## Decisions

- **Auth0**: Skipped — current JWT auth retained as-is per app owner directive
