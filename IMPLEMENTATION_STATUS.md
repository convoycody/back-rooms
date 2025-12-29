# Platform Migration Work Items (Live Status)

This file tracks the four critical items still pending from the Base44 separation plan and what is required to finish them.

## 1) Implement Linode endpoints (entities/ledger/wallet/RNG/audit)
- **Status:** Not yet implemented in this repo. The frontend/functions still call Base44-style resource shapes (`entities.Player.filter`, etc.).
- **Action:** Stand up Linode API routes that mirror (or replace) these contracts:
  - `/auth/*`
  - `/entities/{resource}` (Player, Ledger, HouseConfig, Game, Race*, Lottery, Scratchers, Chat, etc.) with list/filter/create/update
  - `/functions/{name}` for game flows
  - `/ledger`, `/wallet/*`
  - `/rng/seed`, `/rng/verify`
  - `/audit`
- **Notes:** Until these endpoints exist, the app cannot function end-to-end.

## 2) Refactor frontend calls to the new contracts
- **Status:** Not started. All pages/components import the `base44` alias (platform client) and invoke Base44-style entities/functions.
- **Action:** After the Linode API contracts are final, update UI hooks/pages (start with auth, wallet/ledger, then games) to use the new shapes.
- **Notes:** Track progress per page; prioritize Wallet, Home, GamePage, and Admin.

## 3) Service-key enforcement on all serverless functions (PLAN.md A6)
- **Status:** Only telemetry/logging handlers enforce `SERVICE_API_KEY` today.
- **Action:** Add `requireServiceAuth` (or user bearer) checks to every function that mutates data. Require service key for service-role calls; keep user token support where appropriate.
- **Notes:** Introduce a shared guard wrapper to avoid copy/paste.

## 4) Integration/E2E tests (auth, ledger, RNG, slots pilot, then Derby/others)
- **Status:** Not implemented. Current test coverage is lint + typecheck only.
- **Action:** Add integration tests for:
  - Auth (login/logout/me)
  - Ledger (write/read, negative guard)
  - Wallet (deposit/withdraw)
  - RNG (seed/verify once live)
  - Slots E2E (bet → result → payout → ledger/audit → telemetry)
  - Derby/scratchers after slots are green
- **Notes:** Wire these into CI as part of `npm run verify` or separate workflows.

## Outstanding gaps called out previously
- Base44 imports removed: ❌ (frontend still uses `base44` alias; needs refactor once API contracts land)
- Ledger/Wallet service authoritative: ❌
- RNG/seed service: ❌
- Game migrations: ❌

Update this file as work completes to keep everyone aligned.
