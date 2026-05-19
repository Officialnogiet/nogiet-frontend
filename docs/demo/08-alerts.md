# 08 · Alerts

> **Source code:** `nogiet-frontend/components/AlertsDashboard.tsx`,
> `nogiet-frontend/components/alerts/*`,
> `noiget-backend/src/services/notification.service.ts`,
> `noiget-backend/src/services/cron.service.ts`.

## Screen

A list of alerts grouped by severity (critical / high / medium / low) with:

- **Time + facility** label.
- **Detected emission rate** in the user's chosen unit.
- **Mark as read** action; unread count drives the bell badge in the live map
  and the sidebar.
- **Filter** by severity or date.

Each alert links back to the facility on the live map and into the comparison
view.

## How alerts get created

Two pathways:

1. **Threshold alerts** — `CronService` runs every minute, calls the satellite
   aggregator, and for any source whose emission rate exceeds the configured
   facility threshold, calls `NotificationService.evaluateSatelliteSources()`.
   That service inserts an alert row and dispatches:
   - **Email** via Resend (if `RESEND_API_KEY` is set + facility owner has email
     alerts enabled).
   - **SMS** via Termii (if `TERMII_API_KEY` is set + owner has SMS enabled).

2. **Manual alerts** — admins can also create alerts from the Manage Data desk.

## Auto-purge

Alerts older than 24 hours are auto-deleted by a daily job (`purgeOldAlerts()`
inside the emission service) so the dashboard stays focused on recent activity.

## Real-time delivery

The backend emits `socket.emit('alert:new', alert)` on every insertion. The
frontend's `useSocket` hook invalidates the React Query cache for `["alerts"]`,
the bell pulses, and any open Alerts panel updates without a page refresh.

## Demo script

> ► *"Alerts are generated automatically when satellite or ground readings
> exceed a facility's threshold. The system fires email + SMS to the
> responsible operator, logs the alert here, and pushes it to every open
> NOGIET window in real time over WebSockets. Mark as read clears the badge."*
