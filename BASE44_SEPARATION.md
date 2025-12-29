# Base44 Separation Playbook (Current State & Next Actions)

This document captures how we are decoupling from Base44, what remains, and how to validate a resilient, standalone Vertical Holdings deployment on Linode.

## What is already decoupled
- **Serverless functions:** All functions now use a shared `platformClient` (Linode-friendly) instead of `@base44/sdk`. Auth is via bearer tokens or `SERVICE_API_KEY` (for service role).【F:functions/_shared/platformClient.ts†L1-L102】
- **Telemetry:** User/revenue/error reporting enforces `SERVICE_API_KEY` and forwards to DevOps webhooks (see `functions/report*`, `functions/logError`).【F:functions/logError.ts†L1-L40】
- **Frontend client:** Uses `src/api/base44Client.js` (platform wrapper) with endpoints for entities, ledger, wallet, RNG, audit, and service-role calls—no Base44 SDK runtime dependency.【F:src/api/base44Client.js†L1-L171】
- **Plans/guardrails:** Migration guardrails (`MIGRATION.md`) and execution plan (`PLAN.md`) define canonical sources of truth and gates for rollout.

## What still relies on legacy patterns (must be addressed)
- **Contracts:** Frontend and functions still call Base44-style resources (e.g., `entities.Player.filter`, `functions.invoke`). The Linode API must implement these contracts or the callers must be refactored to new resource shapes.
- **Game logic:** All game/vault/admin functions still assume Base44 data schemas (Player, Ledger, HouseConfig, etc.). They need to be pointed at the new canonical services (ledger, RNG, configs) and validated.
- **RBAC & enforcement:** Only telemetry endpoints enforce `SERVICE_API_KEY`. Business functions currently rely on user bearer tokens but do not enforce service-level authorization; add gating per PLAN.md (Platform Rails A1–A6).
- **RNG proofs:** RNG endpoints are stubbed in the client but not wired to a Linode service. Provable fairness is pending.

## Required tests (run on every cut)
- `npm run lint`
- `npm run typecheck`
- API integration tests (login/logout/me, ledger write/read, wallet deposit/withdraw)
- RNG proof tests (seed + verify) once RNG service is live
- Game E2E: bet → result → payout → ledger/audit → telemetry visible in DevOps
- **User-facing error reports:** Trigger an error, use the in-app reporter button, verify an error ID is returned and visible in DevOps/admin logs.

## Hardening checklist (site-wide)
1) **Auth & Tokens**
   - Enforce `SERVICE_API_KEY` on all serverless routes that mutate data.
   - Ensure UI stores tokens only in `localStorage` key `vh_access_token`; add rotation/expiry handling.
2) **RBAC**
   - Server-side permission checks for admin/config endpoints; UI should treat configs as read-only unless admin.
3) **Ledger as source of truth**
   - All balance changes flow through ledger service; no direct balance mutations in games.
   - Ledger entries emit audit + telemetry.
4) **RNG & fairness**
   - Central RNG service issues seeds/nonces and verifies proofs; games consume only via that service.
5) **Telemetry & Audit**
   - All privileged actions emit audit log and forward to DevOps webhooks.
6) **Config drift**
   - House/config settings centralized; UI surfaces them read-only except via admin endpoints.

## How to proceed next
1) Implement Linode endpoints for entities/ledger/wallet/RNG/audit that match (or replace) the Base44-style calls.
2) Refactor frontend pages/components to use the new endpoint shapes (start with auth, ledger, wallet; then games).
3) Add service-key enforcement to all serverless functions per PLAN.md (Platform Rails A6).
4) Add integration/E2E tests for auth, ledger, RNG, and slots (pilot), then Derby and others.

Keep this file in sync with `MIGRATION.md` and `PLAN.md` as milestones are completed.
