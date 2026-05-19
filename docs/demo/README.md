# NOGIET — Client Demo Walkthrough

This folder is a **page-by-page narrative** of the NOGIET portal, written for the
project sponsor and any non-technical stakeholder sitting in on a demo. Each file
covers one screen: what it does, what it shows, what the user can interact with,
and how the data behind it flows.

> **NOGIET** — *Nigerian Oil & Gas Industry Emissions Tracker*. A government-grade
> portal that fuses satellite methane detections (Carbon Mapper, UNEP IMEO,
> Sentinel-5P TROPOMI) with ground-truth measurements collected by Nigerian
> facility operators, and turns the result into an actionable map, alert system,
> and reporting tool.

## Demo running order

The folder is numbered so a presenter can read top to bottom and never need to
backtrack:

| # | File | Screen |
|---|---|---|
| 00 | [00-overview.md](./00-overview.md) | Why NOGIET exists, who uses it, what success looks like |
| 01 | [01-login-and-auth.md](./01-login-and-auth.md) | Login, password reset, OTP, role-based redirect |
| 02 | [02-dashboard-home.md](./02-dashboard-home.md) | KPI cards, 7-day per-source trend, top emitters, alerts, data-source health |
| 03 | [03-live-map.md](./03-live-map.md) | The crown jewel — square emissions grid, per-source plumes, source filter, layers, search, drill-in |
| 04 | [04-methane-trends.md](./04-methane-trends.md) | Long-term trends per feed, annual statistics with state/region/facility group-by |
| 05 | [05-data-comparison.md](./05-data-comparison.md) | Ground-truth vs satellite reconciliation per facility |
| 06 | [06-data-explorer.md](./06-data-explorer.md) | Tabular browser for satellite sources, individual sources, emission rates, cumulative totals, regional aggregations |
| 07 | [07-manage-data.md](./07-manage-data.md) | Add/edit/delete facilities, configure thresholds, submit ground readings |
| 08 | [08-alerts.md](./08-alerts.md) | Alert dashboard, severity, email + SMS notifications, mark-as-read |
| 09 | [09-field-data.md](./09-field-data.md) | Mobile-first form for facility owners (offline queue, photo upload) |
| 10 | [10-user-management.md](./10-user-management.md) | Roles (Super Admin / Admin / Member / Facility Owner) and team workflows |
| 11 | [11-settings.md](./11-settings.md) | Personal preferences, units, dark mode, map theme, alert thresholds |
| 12 | [12-integrations.md](./12-integrations.md) | Carbon Mapper, IMEO V2, TROPOMI — what we ingest, how we authenticate, caching strategy |
| 13 | [13-architecture.md](./13-architecture.md) | High-level system diagram, frontend/backend stack, where the data lives |

## Conventions used in these docs

- **Screen** sections describe what the user sees.
- **Workflow** sections describe what the user does.
- **Data** sections describe what loads behind the scenes.
- **Demo script** call-outs (►) suggest exactly what to say to the client when
  showing the screen.

## How to run a live demo

1. **Backend up:** `cd noiget-backend && npm run dev` (Postgres + Redis must be reachable).
2. **Frontend up:** `cd nogiet-frontend && npm run dev` then open the URL Vite prints.
3. Sign in with a **Super Admin** account so every screen is unlocked. (See
   [01-login-and-auth.md](./01-login-and-auth.md) for the role matrix.)
4. Walk the screens in numbered order — the narrative builds from "what is it"
   to "where does the data come from" without ever leaving the demo flow.

If anything in this folder drifts out of date, the **source of truth** is the
code in `nogiet-frontend/components/` and `noiget-backend/src/` — these docs link
back to specific files for every claim.
