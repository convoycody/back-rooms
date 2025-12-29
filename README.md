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
