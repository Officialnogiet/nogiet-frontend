# 10 · User Management

> **Source code:** `nogiet-frontend/components/UserManagement.tsx`,
> `nogiet-frontend/components/settings/*`,
> `noiget-backend/src/services/user.service.ts`,
> `noiget-backend/src/services/role.service.ts`.

## Screen

A **team members** table (name, email, role, last login, status) with:

- **+ Add member** button → modal that invites a user via email.
- **Edit member** action → change name, role, or deactivate.
- **Roles management** sub-tab → list the four built-in roles + the
  permissions matrix per role.

## Roles

| Role | Capabilities |
|---|---|
| `super_admin` | Everything. Can manage users and roles. |
| `admin` | Can manage facilities, alerts, ground submissions; cannot manage users or roles. |
| `member` | Read-only across most screens; can submit ground data. |
| `facility_owner` | Field Data form only. Cannot see other screens. |

## Workflow

1. **Invite** — Super Admin enters email + role; backend generates a
   one-time-use invitation link emailed via Resend.
2. **First login** — invitee sets a password and lands in the dashboard
   (or Field Data, depending on role).
3. **Edit** — change role, name, deactivate. Deactivated users can no longer
   log in but their submissions remain in the audit trail.

## Demo script

> ► *"Standard role-based access. Super Admin sees everything, regulators see
> what they need, operators only see their submission form. Invite users from
> here, change roles or deactivate without touching the database."*
