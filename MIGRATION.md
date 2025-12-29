# Vertical Holdings Migration Guardrails

This repo is being decoupled from the legacy Base44 stack. Use this checklist to avoid recreating fragmented behavior as we migrate onto the Linode-hosted platform.

## 1) Choose the source of truth (lock it before moving features)

- **Data model:** One canonical schema for players, wallets, ledger, configs, audit logs.
- **Economy rules:** Single implementation for points/XP/tier math and vault rules.
- **Ledger/events:** All economic changes emit ledger + event log entries from one path.
- **Provable fairness:** One RNG/seed authority that increments nonces and stores proofs.

If any of these are ambiguous, stop and decide before porting a feature.

## 2) Migrate in layers (rails → runtime → games)

**Layer A: Platform rails (must be production-grade before games move):**
- Auth and session handling (API + frontend token flow)
- Player profile + privacy settings
- Wallet + Ledger (single source of truth, all payouts route here)
- Admin RBAC and config system (house settings)
- Audit logs and telemetry (ingest + forward to DevOps)

**Layer B: Game runtime framework:**
- Shared game shell and navigation
- Standard event contract: bet → result → payout (with ledger + audit hooks)
- Shared provable RNG service (seed, nonce, verification endpoint)

**Layer C: Games:**
- Migrate one game end-to-end (slots), validate ledger/RNG/audit.
- Then Derby, then Scratchers/lottery/derivations once Layer A/B are stable.

## 3) Implementation guardrails

- **API Gateway:** All serverless/functions require `SERVICE_API_KEY` (already wired).
- **Telemetry:** All user/revenue/error events forward to DevOps hub with app ID + timestamp.
- **Testing:** Run `npm run verify` before releases; add integration tests per layer.
- **Config drift:** Centralize house config in the API; UI should treat it as read-only except via admin endpoints.
- **Ledger integrity:** Every balance or payout change must pass through the ledger service; no direct balance mutations in games.

## 4) Hand-off checklist before porting each game

- ✅ Rails deployed and passing `verify`
- ✅ Auth round-trip works (login/logout/me)
- ✅ Ledger writes and audit log entries visible in DevOps
- ✅ RNG/seed service returns verifiable proofs
- ✅ Admin can update house settings and RBAC is enforced
- ✅ Failover paths: API key rotation + 401 handling on the frontend
