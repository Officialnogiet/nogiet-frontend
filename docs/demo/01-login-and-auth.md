# 01 · Login and authentication

> **Source code:** `nogiet-frontend/screens/auth/*`, `nogiet-frontend/src/api/auth.api.ts`,
> `noiget-backend/src/services/auth.service.ts`.

## Screen

The first thing the user sees is a split-screen login:

- **Left panel** — Brand hero with the NOGIET logo, tagline, and a short
  description (handled by `LoginHeroPanel.tsx`).
- **Right panel** — Email + password form with **show/hide password toggle**,
  a "Remember me" checkbox, and "Forgot password?" link.

Branding (logo + colors) is consistent with the dashboard theme so users know
they're in the right place.

## Workflow

1. **Login** (`screens/auth/Login.tsx`)
   - Validates email format + password length client-side.
   - POST `/api/v1/auth/login` returns a JWT access token + refresh token.
   - Tokens are persisted in `useAuthStore` (Zustand) — never in `localStorage`
     directly, so React stays the source of truth.
2. **Forgot password** (`screens/auth/ForgotPassword.tsx`)
   - User enters their email; backend generates a 6-digit OTP and emails it via
     **Resend** (production-ready ESP, not a mock).
3. **Verify code** (`screens/auth/VerifyCode.tsx`)
   - User pastes/types the 6-digit code; backend confirms it.
4. **New password** (`screens/auth/NewPassword.tsx`)
   - User picks a new password; backend rotates the credential.
5. **Success** (`screens/auth/Success.tsx`)
   - Auto-redirects back to login after 3 seconds.

After a successful login, the user lands in the Dashboard
([02-dashboard-home.md](./02-dashboard-home.md)) — except for **Facility Owners**,
who are routed straight to the **Field Data** form (see
[09-field-data.md](./09-field-data.md)) so they never see screens they don't
have permission for.

## Roles

| Role | Sidebar entries visible |
|---|---|
| `super_admin` | Every screen |
| `admin` | Every screen except User Management management modes |
| `member` | Read-only across most screens |
| `facility_owner` | **Field Data only** — no map, no alerts, no settings |

Role enforcement happens in **two places**:
- Frontend: `Sidebar.tsx` filters menu items.
- Backend: every route uses `authenticate` + `requireRole` middleware.

## Data flow

```
User submits credentials
        │
        ▼
POST /api/v1/auth/login     ←── Fastify route
        │
        ▼
AuthService.login()
        │  - bcrypt.compare(password)
        │  - sign access JWT (15 min)
        │  - sign refresh JWT (7 days)
        ▼
Response { accessToken, refreshToken, user }
        │
        ▼
useAuthStore.setUser(...)   ←── Zustand
        │
        ▼
Axios interceptor attaches `Authorization: Bearer <accessToken>`
        │
        ▼
On 401 → automatic refresh-token call → retry original request
```

The **refresh-token rotation** lets a session stay alive for up to 7 days without
the user re-entering credentials. The access token's short lifespan (15 minutes)
limits damage if a token is ever leaked.

## Demo script

> ► *"NOGIET ships with role-based access. I'm logging in as a Super Admin,
> which unlocks every screen. A regulator at a regional desk would see the same
> screens minus User Management; a facility operator opens the app and goes
> straight to the field-data form. The app handles the redirect — they can't
> get to the map at all."*
