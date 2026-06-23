# @open-paw/cloud — Nekko Cloud (hosted edition)

The multi-account, hosted edition. It wraps the **same** host engine (`@open-paw/host`)
and the **same** React UI as the desktop and self-hosted web editions — just per
authenticated account, with feature limits enforced server-side by plan.

The OSS app (desktop / self-hosted server) **never** signs in or license-checks.
Only this hosted edition has accounts and entitlements.

## What's here (Phase 3.1 — Cloud foundation)

- **Accounts + auth** (`accounts.ts`): email/password sign-up & log-in, scrypt
  password hashing (`node:crypto`, no deps), bearer session tokens. File-backed
  (`cloud.json`) behind a small `CloudStore` interface so a Postgres impl can
  drop in later.
- **Per-account isolation** (`server.ts`): each account gets its own data dir and
  its own `Host` instance; every authenticated request runs inside
  `withDataDir(accountDir, …)` so settings/sessions/memory never cross accounts.
- **Entitlements** (`entitlements.ts`): `free` / `pro` / `team` → workspace and
  device limits, ZDR, cloud-sync, managed connectors. Gated server-side in the
  dispatch path (e.g. the free-plan workspace cap).
- **Login gate** (renderer `components/CloudLogin.tsx`): shown only when
  `/api/auth/config` reports cloud mode and there's no valid session; stores the
  account token as the Bearer the existing web-client already sends.

## Run it

```bash
npm run cloud            # from repo root: builds engine + renderer, serves :4318
```

Environment:

- `CLOUD_PORT` (default `4318`), `CLOUD_HOST` (default `127.0.0.1`)
- `CLOUD_DATA_DIR` (default `~/.open-paw-cloud`) — cloud metadata + per-account dirs
- `OPENPAW_RENDERER_DIR` — override the served renderer build

## API

| Route | Auth | Purpose |
| --- | --- | --- |
| `GET /api/auth/config` | — | `{ cloud: true }` (renderer uses this to decide whether to gate) |
| `POST /api/auth/signup` | — | `{ email, password }` → `{ token, account, entitlements }` |
| `POST /api/auth/login` | — | `{ email, password }` → `{ token, account, entitlements }` |
| `GET /api/auth/me` | Bearer | `{ account, entitlements }` |
| `POST /api/auth/logout` | Bearer | invalidate the token |
| `POST /api/:channel` | Bearer | the full NekkoApi, scoped to the account |
| `GET /api/events` (WS) | Bearer (`?token=`) | the account's agent/index events |

## Still TODO (later Phase 3)

- Stripe Checkout + Customer Portal + webhooks → `store.setPlan` (entitlement gating already exists)
- ZDR mode + cloud chat-history / file management + encrypted-at-rest sync
- Device registry + revocation (builds on accounts + the relay)
- Managed connectors (pre-registered OAuth apps)
