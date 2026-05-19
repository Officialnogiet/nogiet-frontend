# 09 · Field Data (operator PWA)

> **Source code:** `nogiet-frontend/components/FieldDataForm.tsx`,
> `nogiet-frontend/src/utils/offline-storage.ts`,
> `noiget-backend/src/repositories/emission.repository.ts`.

This is the screen a **facility owner** sees first when they log in. Every
other menu entry is hidden for that role.

## Screen

A mobile-first form to submit a ground methane reading from the field:

- **Facility** dropdown (limited to the operator's facilities).
- **Latitude / Longitude** — auto-filled from `navigator.geolocation`.
- **Methane reading** in kg/hr.
- **Methodology** — OGI camera, sniffer drone, fixed sensor.
- **Equipment used** (free text).
- **Weather conditions** (free text).
- **Notes** (free text).
- **Photos** — upload to Cloudflare R2 (S3-compatible).

## Offline mode

If the device is offline (no network), the submission is **queued in IndexedDB**
via `offline-storage.ts`. As soon as the device regains connectivity, a
background sync flushes the queue. The user sees a banner "Queued offline — will
sync when online" and a count of pending submissions.

## Approval workflow

Submissions land as **pending**. An Admin reviews them in the Manage Data
desk and approves or rejects. Approved submissions are merged into the
ground-readings dataset and become visible on the Live Map and Comparison
screens.

## Demo script

> ► *"This is what a facility operator sees when they log in. They never see
> the map or the alerts — their job is to submit ground readings, attach
> photos, and let head office triage. If they're in a remote location with no
> bars, the form queues offline and syncs the next time they get a signal."*
