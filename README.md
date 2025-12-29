# Base44 App

## Feature map (quick tour)

| Area | What it covers | Entry point |
| --- | --- | --- |
| Lobby & onboarding | Home experience, referral gating, chat preview | `src/pages/Home.jsx` |
| Vault games | 50/50 pool, Numbers Lottery | `src/pages/FiftyFiftyPool.jsx`, `src/pages/NumbersLottery.jsx` |
| Derby | Lobby, race view, owner tools, sharing | `src/pages/DerbyLobby.jsx`, `src/pages/DerbyRace.jsx`, `src/pages/DerbyStable.jsx`, `src/pages/DerbyRaceShare.jsx` |
| Admin | Site configuration, slots breakdown, moderation | `src/pages/Admin.jsx`, `src/pages/SlotsBreakdown.jsx`, `src/pages/Moderation.jsx` |
| Legal & policy | Responsible play, crypto disclosure, jurisdiction | `src/pages/ResponsiblePlay.jsx`, `src/pages/CryptoDisclosure.jsx`, `src/pages/Jurisdiction.jsx` |
| Support | Help, announcements, receipts | `src/pages/Support.jsx`, `src/pages/Announcements.jsx`, `src/pages/Receipt.jsx` |

Routes are declared in `src/pages.config.js`, which maps page names to components and the shared layout.

## Installation, verification, and DevOps integration

Use the following workflow to install dependencies, run the full test suite, and ship builds that stream telemetry to Vertical Holdings DevOps Hub and the new self-hosted API stack (no Base44 dependencies).

### Migration plan (read first)

- High-level guardrails: `MIGRATION.md`
- Execution plan with gates and test requirements: `PLAN.md`
- Separation status and hardening checklist: `BASE44_SEPARATION.md`
- Work-in-progress tracker for remaining migration items: `IMPLEMENTATION_STATUS.md`
- Target Linode API contract the app expects: `API_CONTRACT.md`

### Prerequisites

- Node 18+ (for Vite and the web app)
- Deno (for `/functions` serverless endpoints)
- Access to the Vertical Holdings DevOps Hub webhook endpoints

### One-command verification

```bash
npm ci
npm run verify
```

`npm run verify` runs linting, static type checks, and the production build (`lint` → `typecheck` → `build`).

### Environment variables for DevOps reporting

These settings make the serverless functions forward logs, revenue, user metrics, and errors to the DevOps Hub:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL for the Linode-hosted API (used by the front-end client) | `https://api.vertical-holdings.dev` |
| `VITE_AUTH_LOGIN_URL` | Optional override for the hosted login page | `${VITE_API_BASE_URL}/auth/login` |
| `VITE_AUTH_LOGOUT_URL` | Optional override for the hosted logout page | `${VITE_API_BASE_URL}/auth/logout` |
| `VITE_APP_ID` | Application identifier used when requesting public settings | _unset_ |
| `DEVOPS_BASE_URL` | Base URL for the DevOps Hub webhook endpoints | `https://preview-sandbox--08aa848c2c6112c212d7b47df9e77830.base44.app` |
| `DEVOPS_API_KEY` | Bearer token added to webhook requests (optional) | _unset_ |
| `DEVOPS_APP_ID` | App ID attached to outbound events | `base44-app` |
| `DEVOPS_APP_NAME` | Human-friendly app name attached to outbound events | `Base44 App` |
| `SERVICE_API_KEY` | Shared secret required by Deno functions before forwarding telemetry | _unset_ |

### Deployment blueprint (staging + production)

- Maintain two isolated environments (staging/prod) with separate databases and secrets. Point staging to `develop` (or a staging branch) and production to `main`.
- Required backend endpoints: `/auth/*`, `/entities/*` (Player, Ledger, HouseConfig, Game, Race*, Lottery, Scratchers, Chat, etc.), `/functions/*` (game flows, telemetry, error logging), `/ledger`, `/wallet/*`, `/rng/seed`, `/rng/verify`, `/audit`.
- Required services: database for the above entities, file storage for uploads (if used), RNG/verification service, and DevOps webhooks reachable from functions.
- Frontend uses `VITE_API_BASE_URL` to hit your Linode API; set `VITE_SERVICE_API_KEY` for service-role calls.
- Badge/verification flows: provide a `/badge/verify` endpoint on your API; the Admin page includes a placeholder button until implemented.

### Available webhook integrations

The Deno functions automatically forward to DevOps:

- `functions/reportUserEvent.ts` → `/api/functions/webhooks/userEvent`
- `functions/reportRevenueEvent.ts` → `/api/functions/webhooks/revenueEvent`
- `functions/reportAppError.ts` and `functions/logError.ts` → `/api/functions/webhooks/appError`

All payloads include an ISO timestamp and app identity, ensuring they appear in the DevOps Logs Monitor and dashboards. The Deno functions now validate a `SERVICE_API_KEY` header (via `Authorization: Bearer <key>` or `x-api-key`) instead of relying on Base44 authentication, so you can deploy them on your own Linode environment.
