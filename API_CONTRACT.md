# Linode Platform API Contract (Target Shape for Frontend & Functions)

This is the authoritative contract the frontend and serverless functions expect. Implement these endpoints on the Linode API before cutting over.

## Auth
- `GET /auth/me` → returns current user.
- `POST /auth/login` → { email, password | token } → { token, user }.
- `POST /auth/logout` → clears session/token.

## Entities (generic data access)
Base path: `/entities/{resource}`
- `GET /entities/{resource}` → list (supports `orderBy`, `limit` query params).
- `POST /entities/{resource}/filter` → { filters, orderBy?, limit? }.
- `POST /entities/{resource}` → create.
- `PUT /entities/{resource}/{id}` → update.

Expected resources (minimum): Player, Ledger, WalletTransaction, HouseConfig, Game, GameSession, RaceEvent, RaceEntry, RaceBet, RaceHorse, NumbersLottery*, ScratchCard*, Ticket, ChatMessage, Announcement, ErrorLog, Achievement, PlayerAchievement.

## Functions (game/admin flows)
Base path: `/functions/{name}`
- Called with `POST` and JSON body. Implement server-side handlers for all game/admin flows currently invoked by the UI/functions (slots spins, lottery draws, vault actions, ticket purchases, announcements, etc.).

## Ledger
- `POST /ledger` → create ledger entry (authoritative for all balance deltas).
- `POST /ledger/filter` → { filters, orderBy?, limit? }.

## Wallet
- `GET /wallet/balance` → current balance.
- `POST /wallet/deposit` → { amount, source? }.
- `POST /wallet/withdraw` → { amount, destination? }.

## RNG / Provable Fairness
- `POST /rng/seed` → { game_slug, player_id?, client_seed? } → { server_seed_hash, nonce }.
- `POST /rng/verify` → { server_seed, client_seed, nonce, result } → { valid: boolean }.

## Audit
- `POST /audit` → { actor, action, target, metadata }.
- `POST /audit/filter` → { filters, orderBy?, limit? }.

## Telemetry / DevOps
- Functions already forward to DevOps webhooks; ensure outbound internet access and set `DEVOPS_BASE_URL`, `DEVOPS_API_KEY`, `DEVOPS_APP_ID`, `DEVOPS_APP_NAME`.

## AuthZ / Service Key
- All mutation endpoints should accept `Authorization: Bearer <user_token>` for users and optionally `Authorization: Bearer <SERVICE_API_KEY>` for service-role operations. Serverless functions already send service-role calls using this pattern.

## Staging vs Production
- Provide two isolated environments (staging/prod) with separate DBs/secrets. The frontend points to the correct environment via `VITE_API_BASE_URL` and `VITE_SERVICE_API_KEY`.

Keep this document in sync with backend implementations and update the frontend/function calls if the contract changes.
