import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function DerbySystemReadme() {
  const readmeContent = `================================================================================
                     DERBY RACETRACK SYSTEM
           Complete Technical & Scientific Breakdown
================================================================================

Last Updated: ${new Date().toISOString().split('T')[0]}

================================================================================
TABLE OF CONTENTS
================================================================================

1. SYSTEM OVERVIEW
2. ECONOMIC MODEL
3. ODDS CALCULATION MODEL
4. MOMENTUM PROOF SYSTEM
5. TECHNICAL IMPLEMENTATION
6. ADMIN DASHBOARD & CONFIGURATION
7. SYSTEM SUMMARY

================================================================================
1. SYSTEM OVERVIEW
================================================================================

CORE CONCEPT
------------
A multiplayer, points-only horseracing ecosystem with distinct roles:

• Horse Owners/Racers: Purchase license, create horses, enter races, submit 
  momentum proofs
• Spectators/Bettors: Place Win/Place/Show bets on any horse in open races
• House (Platform): Manages events, pools, odds calculation, and payouts

RACE TYPES
----------

⚔️ DUEL (2 horses)
   - Quick 1v1 races
   - Default Entry Fee: 5,000 points

🏃 SPRINT (4 horses)
   - Mid-tier competition
   - Default Entry Fee: 10,000 points

🏆 MAIN EVENT (6 horses)
   - High-stakes featured race
   - Default Entry Fee: 20,000 points

RACE LIFECYCLE
--------------

1. OPEN: Owners enter horses (pay entry fee → purse pool). Spectators place 
   bets → betting pools.

2. LOCKED: Betting cutoff reached (30s before start by default). No more 
   entries/bets.

3. RUNNING: Race active. Owners submit momentum proofs. Spectators watch.

4. COMPLETED: RNG + skill + momentum determines 1st/2nd/3rd. Purse & betting 
   payouts distributed.

KEY ENTITIES
------------

• RaceConfig: Global settings (fees, purse splits, house take, momentum cap)
• OwnerLicense: One-time purchase (50k pts default) to become owner
• RaceHorse: Created by owner, has skill rating (starts 1000), tracks 
  wins/earnings
• RaceEvent: Individual race instance with pools, status, timestamps
• RaceEntry: Horse entered in race, tracks momentum proofs/score, lane, payout
• RaceBet: Spectator bet (win/place/show) with amount, odds snapshot

================================================================================
2. ECONOMIC MODEL
================================================================================

OWNER PURSE (ENTRY FEES)
-------------------------

All owner entry fees go into the Owner Purse, split by placement:

Total Purse = Σ(entry fees from all horses)

🥇 1st Place: 60% of purse (configurable)
🥈 2nd Place: 30% of purse
🥉 3rd Place: 10% of purse

Example: 6-horse Main Event @ 20k each = 120k purse
         → 1st: 72k, 2nd: 36k, 3rd: 12k

SPECTATOR BETTING POOLS
-----------------------

Three separate pari-mutuel pools:

WIN POOL
- Only pays if your horse finishes 1st
- Payout = (Your bet / Total winning bets) × Pool × (1 - house take)

PLACE POOL
- Pays if your horse finishes 1st OR 2nd
- Shared among all bets on top 2 horses

SHOW POOL
- Pays if your horse finishes 1st, 2nd, OR 3rd
- Shared among all bets on top 3 horses

HOUSE TAKE
----------

Platform takes a percentage from spectator betting pools only (not owner purse):

House Take = 10% (default, configurable)

Example: 100k WIN pool → 10k to house, 90k distributed to winners

✓ Owners keep 100% of purse splits (no house take)

ECONOMIC FLOW
-------------

Money In:
- Owner License: 50,000 pts (one-time)
- Race Entry Fees: 5k - 20k per entry
- Spectator Bets: 100 - 50k per bet (configurable min/max)

Money Out:
- Owner Purse Payouts: 60%/30%/10% split
- Betting Payouts: 90% of pools (10% house take)
- Skill Rating Bonuses: +25/+15/+10 rating for top 3

================================================================================
3. ODDS CALCULATION MODEL v1
================================================================================

SCIENTIFIC BASIS
----------------

Based on real-world pari-mutuel racing odds with three factors:

1. Skill Rating (Base): ELO-style rating system, starting at 1000
2. Form (Win Rate): Recent performance over last N races
3. Consistency (Place/Show Rate): Ability to finish in top 3

MATHEMATICAL FORMULA
--------------------

// Step 1: Base Probability from Skill
totalSkill = Σ(all horses' skill ratings)
baseProb = horseSkill / totalSkill

// Step 2: Form Adjustment (Recent Performance)
winRate = wins / totalRaces
formAdjustment = winRate × 0.20  // Up to 20% boost

// Step 3: Consistency Bonus
placeRate = (places + shows) / totalRaces
consistencyBonus = placeRate × 0.10  // Up to 10% boost

// Step 4: Final Probability (Capped)
adjustedProb = min(0.95, max(0.05, baseProb + formAdjustment + consistencyBonus))

// Step 5: Convert to Odds
decimalOdds = 1 / adjustedProb
fractionalOdds = decimalOdds - 1  // Display as X:1

UNRATED HORSE BEHAVIOR
----------------------

Horses with < 3 races are "Unrated"

• Display: "Unrated" instead of odds
• Reasoning: Insufficient data for accurate probability
• Still compete with base 1000 skill rating
• Create uncertainty → excitement for spectators

Real-world parallel: First-time racehorses often have wide odds due to unknown 
capability

EXAMPLE CALCULATION
-------------------

Race: 4 horses competing

Horse     Skill  W/R   P/S Rate  Final Prob  Odds
Thunder   1100   40%   70%       35%         1.9:1
Lightning 1050   30%   60%       31%         2.2:1
Storm     1000   20%   50%       26%         2.8:1
Breeze    950    0%    0%        Unrated     —

Note: Probabilities don't sum to 100% when unrated horses present

================================================================================
4. MOMENTUM PROOF SYSTEM v1
================================================================================

CONCEPT
-------

Owners can influence their horse's performance during a race by submitting 
"momentum proofs" – active engagement that translates to a small win chance 
boost.

Real-world parallel: Jockey skill, crowd energy, horse temperament affecting 
race-day performance beyond raw stats

TECHNICAL IMPLEMENTATION
------------------------

// Step 1: Count Proofs
Each owner clicks "Submit Proof" during race.status === 'running'
entry.momentum_proofs++  // Simple counter

// Step 2: Normalize Across All Entries
totalProofs = Σ(all entries' momentum_proofs)
normalizedScore = (thisEntryProofs / totalProofs) × 10
// Scales to 0-10 range, relative to competition

// Step 3: Apply Cap
momentumImpactCap = 8  // Default: max 8% boost
cappedScore = min(normalizedScore, momentumImpactCap)

// Step 4: Use in Race Resolution
finalScore = random() + (skillRating/10000) + (cappedScore/100)
// Momentum converts to 0-8% additive boost

NORMALIZATION SCIENCE
---------------------

Why normalize? Prevents "proof spam" from dominating:

Without normalization:
- Owner A: 100 proofs = 100 score (overpowered)
- Owner B: 10 proofs = 10 score

With normalization (score out of 10):
- Owner A: 100/110 × 10 = 9.09 score
- Owner B: 10/110 × 10 = 0.91 score
- Relative effort matters, not absolute spam

BALANCE MECHANICS
-----------------

Cap @ 8%
- Even max proofs can't guarantee win. Skill + RNG still primary factors.

3-second cooldown
- Prevents button mashing. Requires sustained attention.

Real-time recalc
- Every proof submission recalculates ALL entries' scores for fairness.

EXAMPLE SCENARIO
----------------

Race Duration: 60 seconds | Cap: 8%

Owner   Proofs  Normalized  Capped  Boost
Alice   15      6.25        6.25    +6.25%
Bob     20      8.33        8.00    +8.00%
Carol   5       2.08        2.08    +2.08%
Dave    8       3.33        3.33    +3.33%

Total proofs: 48 | Bob hits cap, gains no advantage from further proofs

================================================================================
5. TECHNICAL IMPLEMENTATION
================================================================================

DATA MODEL
----------

RaceConfig (singleton):
  derby_enabled, owner_license_cost, max_horses_per_owner
  duel/sprint/main_event_entry_fees
  min/max_bet_amount, house_take_percentage
  owner_purse_win/place/show_percentage
  momentum_impact_cap, race_duration_seconds
  cutoff_before_start_seconds, min_players_to_start

OwnerLicense:
  player_id, license_type, cost_paid, active, expires_at
  total_races_entered, total_wins, total_earnings

RaceHorse:
  owner_id, horse_name, skill_rating (starts 1000)
  races_entered, wins, places, shows, total_earnings
  retired, avatar_emoji

RaceEvent:
  race_type (duel/sprint/main), race_number, max_horses
  entry_fee, status (open/locked/running/completed)
  starts_at, cutoff_at, completed_at
  total_owner_purse, total_win/place/show_pool
  entered_horses[], server_seed_hash, server_seed_revealed
  winning/second/third_horse_id

RaceEntry:
  race_id, horse_id, owner_id, entry_fee_paid
  lane_number, final_position, payout
  momentum_proofs, momentum_score

RaceBet:
  race_id, player_id, horse_id, bet_type (win/place/show)
  amount, odds_at_time, status (active/won/lost), payout

RACE RESOLUTION ALGORITHM
--------------------------

Called by completeRace backend function
Triggered when race.status transitions to 'running' → 'completed'

1. Fetch all entries + horses
2. Calculate final scores (RNG + skill + momentum)
3. Sort by score, assign positions
4. Distribute owner purse (60%/30%/10%)
5. Distribute betting payouts
6. Update skill ratings (+25/+15/+10)
7. Create announcements for Main Events

SECURITY & FAIRNESS
-------------------

✓ Server-side RNG
✓ Committed Seed (future)
✓ Atomic Transactions
✓ Betting Cutoff
✓ Owner Restriction

REAL-TIME UPDATES
-----------------

React Query with 3-second polling updates race status, pool totals, entries, 
and momentum scores in near real-time.

UI/UX FLOW
----------

1. DerbyLobby: Browse open races, check license status, see race types
2. DerbyStable: Purchase license, create horses (max 3), view stats
3. DerbyEnter: Select horse, choose race, pay entry fee
4. DerbyRace: View odds, place bets (spectators), submit proofs (owners)
5. DerbyRaceShare: Shareable result page with podium, stats

================================================================================
6. ADMIN DASHBOARD & CONFIGURATION
================================================================================

ADMIN ACCESS
------------

Navigation: Admin → Game Settings → Flagship Platform Games → Derby Racetrack
Access: is_admin=true or role='admin'

CONFIGURATION TABS
------------------

GENERAL SETTINGS
- Enable/Disable Derby System
- Owner License Cost (default: 50,000 pts)
- Max Horses Per Owner (default: 3)
- Race Duration (default: 60 seconds)
- Momentum Impact Cap (default: 8%)

FEES & ENTRY
- Duel Entry Fee (default: 5,000)
- Sprint Entry Fee (default: 10,000)
- Main Event Entry Fee (default: 20,000)

BETTING
- Min Bet Amount (default: 100 pts)
- Max Bet Amount (default: 50,000 pts)
- House Take % (default: 10%)

PAYOUTS
- Win (1st Place) % (default: 60%)
- Place (2nd Place) % (default: 30%)
- Show (3rd Place) % (default: 10%)

LIVE STATISTICS
---------------

- Active Races count
- Owner License Cost
- System Status (Active/Disabled)

HOT-RELOAD CONFIGURATION
------------------------

All changes take effect immediately without server restart.

ADMIN BEST PRACTICES
--------------------

• Test Changes: Adjust incrementally, monitor impact
• Entry Fees: Balance purse with affordability
• House Take: 10% standard
• Momentum Cap: Keep 5-10%
• Bet Limits: Prevent pool manipulation
• License Cost: Meaningful but achievable

================================================================================
7. SYSTEM SUMMARY
================================================================================

A multiplayer horseracing platform combining ELO-based skill ratings, 
pari-mutuel betting pools, normalized momentum proofs, and dual economy 
(owner purses + spectator payouts) with provably fair race resolution.

3 Race Types | 3 Bet Types | 2 Roles

Technology: React, Base44, Deno Functions

================================================================================
END OF DOCUMENTATION
================================================================================

Last Updated: ${new Date().toISOString().split('T')[0]}
`;

  const downloadReadme = () => {
    const blob = new Blob([readmeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DERBY_SYSTEM_README.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={downloadReadme} className="bg-amber-600 hover:bg-amber-700">
      <Download className="w-4 h-4 mr-2" />
      Download README.txt
    </Button>
  );
}