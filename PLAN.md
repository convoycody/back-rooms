# Migration Execution Plan (Vertical Holdings)

This plan turns the high-level guardrails in `MIGRATION.md` into concrete workstreams, gates, and test expectations. Work in this order to avoid split-brain between the new Linode platform and legacy Base44 code.

## Decision locks (must stay canonical)
- Data model & IDs for players, wallets, ledger, configs, audit logs.
- Economy rules: points/XP/tier formulas, vault rules, payout math.
- Provable fairness: RNG seed/nonce ownership and verification API.
- Event/ledger writes: one path only, no duplicate writers.

If any of these change, update this plan and `MIGRATION.md` together.

## Workstreams, tasks, and acceptance criteria

### A. Platform rails (must be green before moving games)
1) **Auth & Identity**
   - Implement `/auth/me`, `/auth/login`, `/auth/logout` on Linode API.
   - Frontend uses only the new platform client; remove Base44 SDK imports.
   - Tests: login/logout round-trip, token refresh, 401 handling in UI.
2) **Player Profile & Privacy**
   - CRUD for player profile and privacy flags via new API.
   - Tests: profile update persists; privacy toggles respected in UI lists.
3) **Wallet + Ledger (single source of truth)**
   - Ledger service owns all balance mutations; no direct balance writes in games.
   - Endpoint to list/create ledger entries; payout helpers call ledger only.
   - Tests: ledger write idempotency, negative balance guard, audit trail.
4) **Admin RBAC & House Config**
   - Roles/permissions enforced server-side; admin UI reads configs read-only unless privileged.
   - Tests: unauthorized admin actions 403; config writes emit audit log.
5) **Audit Logs & Telemetry**
   - Every privileged action emits an audit record and forwards to DevOps.
   - Tests: audit entry presence for admin writes; telemetry webhook receipt.
6) **Service Auth for Functions**
   - `SERVICE_API_KEY` enforced for all serverless endpoints (already applied to telemetry; extend to others before data writes).
   - Tests: 401 without key; success with key.

### B. Game runtime framework
1) **Standard event contract**
   - Define bet → result → payout payloads and expected ledger/audit hooks.
   - Tests: contract validator + sample fixture.
2) **Provable RNG service**
   - API for seed/nonce issuance and proof verification.
   - Tests: deterministic proof verification; nonce increments serialized.
3) **Game shell**
   - Shared React hooks/components for session state, error logging, and payout submission to ledger service.
   - Tests: hook unit tests; integration with ledger mock.

### C. Game migrations (after A/B are stable)
1) **Slots (pilot)**
   - Repoint data calls to new platform endpoints; remove Base44 entities.
   - Tests: end-to-end play results in ledger entries and telemetry.
2) **Derby**
   - Same as above after slots validated.
3) **Scratchers / Lottery / Others**
   - Migrate sequentially; reuse framework contracts.

## Execution order with gates
1. Finish Platform Rails (A1–A6) → gate: `verify` + auth/ledger/audit tests pass.
2. Implement Runtime Framework (B1–B3) → gate: contract tests + RNG proofs.
3. Migrate Slots (C1) → gate: E2E test with ledger + telemetry visible in DevOps.
4. Migrate Derby (C2) → gate: E2E parity vs legacy outcomes.
5. Migrate remaining games (C3) → gate: per-game E2E + ledger consistency checks.

## Test matrix (add to CI)
- `npm run verify` (lint + typecheck + build)
- Frontend auth flow tests (login/logout/me, 401 redirect)
- Ledger contract tests (non-negative, double-spend guards, audit emission)
- RNG proof tests (nonce monotonicity, verification)
- Game E2E (per game after migration) with telemetry assertion

## Status snapshot
- Guardrails documented: ✅ (`MIGRATION.md`)
- Type coverage widened to entire `src`: ✅
- Telemetry functions API-key protected: ✅
- Base44 imports removed: ❌ (frontend still uses `base44` alias; needs refactor)
- Ledger/Wallet service authoritative: ❌ (still legacy patterns)
- RNG/seed service: ❌ (not implemented)
- Game migrations: ❌ (not started)

Keep this file and `MIGRATION.md` in sync whenever scope or gates change.
