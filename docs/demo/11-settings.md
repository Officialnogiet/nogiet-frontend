# 11 · Settings

> **Source code:** `nogiet-frontend/components/SettingsPage.tsx`,
> `nogiet-frontend/components/settings/*`,
> `nogiet-frontend/src/stores/settings.store.ts`.

## Screen

A grouped preferences panel.

### Personal preferences

- **Emission unit** — kg/hr, kg/day, tonnes/year, CO₂e/hr. Every chart and
  table re-renders in the chosen unit immediately.
- **Dark mode** toggle.
- **Default region** for the live map opening view.
- **Map theme** — Dark / Light / Satellite.

### Alerts

- **Default alert threshold** in kg/hr — used when a facility doesn't have
  its own threshold set.
- **Email alerts** on/off.
- **SMS alerts** on/off (only available if Termii is configured server-side).

### Profile

- Update display name.
- Change password (with current-password confirmation).

## Workflow

All settings are persisted **per user** via `useSettingsStore` (Zustand
+ localStorage). They survive logout and follow the user across browsers when
backed up to the backend (for fields that round-trip, like alert preferences).

## Demo script

> ► *"Personal preferences: pick your unit (kg/hr, tonnes/year, CO₂e/hr), turn
> on dark mode, change the map theme. Alert preferences let each user toggle
> their own email and SMS notifications without involving an Admin."*
