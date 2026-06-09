# Development access

> ⚠️ Authentication is **not implemented yet**. The accounts below are seed data
> only. At this stage there is **no login, no password, no JWT** — these users
> cannot authenticate.

## Seed users

| Email                | Role       | Password           |
| -------------------- | ---------- | ------------------ |
| `admin@ipp.local`    | `ADMIN`    | not configured yet |
| `operator@ipp.local` | `OPERATOR` | not configured yet |

These users are created idempotently by `pnpm --filter api db:seed`.
Their `passwordHash` is currently `null` in the database.

## Future auth update

When authentication is implemented (Phase 6), this file **must be updated**:

- Document the development accounts that are actually usable to log in.
- **No real password must ever be stored in GitHub.**
- Development passwords must come from the local `.env` file (which is git-ignored).
- Only the **names** of the environment variables should be documented here, for example:
  - `SEED_ADMIN_PASSWORD`
  - `SEED_OPERATOR_PASSWORD`
- The seed will read these variables to set hashed passwords; the plain values stay
  local and never reach the repository.
