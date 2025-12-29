import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DerbySystemReadme from './DerbySystemReadme';

export default function DerbySystemBreakdown() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white mb-3">🏇 Derby Racetrack System</h1>
        <p className="text-slate-400 mb-4">Complete Technical & Scientific Breakdown</p>
        <DerbySystemReadme />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="economics">Economics</TabsTrigger>
          <TabsTrigger value="odds">Odds Model</TabsTrigger>
          <TabsTrigger value="momentum">Momentum</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">System Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="text-amber-400 font-bold mb-2">🎯 Core Concept</h3>
                <p>A multiplayer, points-only horseracing ecosystem with distinct roles:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Horse Owners/Racers:</strong> Purchase license, create horses, enter races, submit momentum proofs</li>
                  <li><strong>Spectators/Bettors:</strong> Place Win/Place/Show bets on any horse in open races</li>
                  <li><strong>House (Platform):</strong> Manages events, pools, odds calculation, and payouts</li>
                </ul>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🏁 Race Types</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-red-900/20 border border-red-700/50 rounded p-3">
                    <p className="font-bold text-white">⚔️ Duel (2 horses)</p>
                    <p className="text-sm text-slate-400">Quick 1v1 races</p>
                    <p className="text-amber-400 text-xs mt-1">Default: 5,000 entry fee</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
                    <p className="font-bold text-white">🏃 Sprint (4 horses)</p>
                    <p className="text-sm text-slate-400">Mid-tier competition</p>
                    <p className="text-amber-400 text-xs mt-1">Default: 10,000 entry fee</p>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-700/50 rounded p-3">
                    <p className="font-bold text-white">🏆 Main Event (6 horses)</p>
                    <p className="text-sm text-slate-400">High-stakes featured race</p>
                    <p className="text-amber-400 text-xs mt-1">Default: 20,000 entry fee</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🔄 Race Lifecycle</h3>
                <ol className="list-decimal ml-6 space-y-2">
                  <li><strong>OPEN:</strong> Owners enter horses (pay entry fee → purse pool). Spectators place bets → betting pools.</li>
                  <li><strong>LOCKED:</strong> Betting cutoff reached (30s before start by default). No more entries/bets.</li>
                  <li><strong>RUNNING:</strong> Race active. Owners submit momentum proofs. Spectators watch.</li>
                  <li><strong>COMPLETED:</strong> RNG + skill + momentum determines 1st/2nd/3rd. Purse & betting payouts distributed.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">📊 Key Entities</h3>
                <div className="bg-slate-800 rounded p-3 text-xs font-mono space-y-1">
                  <p><strong>RaceConfig:</strong> Global settings (fees, purse splits, house take, momentum cap)</p>
                  <p><strong>OwnerLicense:</strong> One-time purchase (50k pts default) to become owner</p>
                  <p><strong>RaceHorse:</strong> Created by owner, has skill rating (starts 1000), tracks wins/earnings</p>
                  <p><strong>RaceEvent:</strong> Individual race instance with pools, status, timestamps</p>
                  <p><strong>RaceEntry:</strong> Horse entered in race, tracks momentum proofs/score, lane, payout</p>
                  <p><strong>RaceBet:</strong> Spectator bet (win/place/show) with amount, odds snapshot</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ECONOMICS */}
        <TabsContent value="economics">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Economic Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="text-amber-400 font-bold mb-2">💰 Owner Purse (Entry Fees)</h3>
                <p className="mb-2">All owner entry fees go into the <strong>Owner Purse</strong>, split by placement:</p>
                <div className="bg-slate-800 rounded p-3">
                  <p className="font-mono text-sm">Total Purse = Σ(entry fees from all horses)</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>🥇 1st Place: <span className="text-amber-400">60%</span> of purse (configurable)</li>
                    <li>🥈 2nd Place: <span className="text-slate-400">30%</span> of purse</li>
                    <li>🥉 3rd Place: <span className="text-orange-400">10%</span> of purse</li>
                  </ul>
                  <p className="mt-2 text-xs text-slate-500">Example: 6-horse Main Event @ 20k each = 120k purse → 1st: 72k, 2nd: 36k, 3rd: 12k</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🎰 Spectator Betting Pools</h3>
                <p className="mb-2">Three separate pari-mutuel pools:</p>
                <div className="space-y-3">
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-3">
                    <p className="font-bold text-white">WIN Pool</p>
                    <p className="text-sm">Only pays if your horse finishes 1st</p>
                    <p className="text-xs text-slate-400 mt-1">Payout = (Your bet / Total winning bets) × Pool × (1 - house take)</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
                    <p className="font-bold text-white">PLACE Pool</p>
                    <p className="text-sm">Pays if your horse finishes 1st OR 2nd</p>
                    <p className="text-xs text-slate-400 mt-1">Shared among all bets on top 2 horses</p>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-700/50 rounded p-3">
                    <p className="font-bold text-white">SHOW Pool</p>
                    <p className="text-sm">Pays if your horse finishes 1st, 2nd, OR 3rd</p>
                    <p className="text-xs text-slate-400 mt-1">Shared among all bets on top 3 horses</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🏦 House Take</h3>
                <p className="mb-2">Platform takes a percentage from <strong>spectator betting pools only</strong> (not owner purse):</p>
                <div className="bg-slate-800 rounded p-3">
                  <p className="font-mono text-sm">House Take = 10% (default, configurable)</p>
                  <p className="text-xs text-slate-400 mt-2">Example: 100k WIN pool → 10k to house, 90k distributed to winners</p>
                  <p className="text-xs text-green-400 mt-1">✓ Owners keep 100% of purse splits (no house take)</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">📈 Economic Flow</h3>
                <div className="bg-slate-800 rounded p-3 text-sm">
                  <p className="font-bold mb-2">Money In:</p>
                  <ul className="list-disc ml-6 space-y-1 text-xs">
                    <li>Owner License: 50,000 pts (one-time)</li>
                    <li>Race Entry Fees: 5k - 20k per entry</li>
                    <li>Spectator Bets: 100 - 50k per bet (configurable min/max)</li>
                  </ul>
                  <p className="font-bold mt-3 mb-2">Money Out:</p>
                  <ul className="list-disc ml-6 space-y-1 text-xs">
                    <li>Owner Purse Payouts: 60%/30%/10% split</li>
                    <li>Betting Payouts: 90% of pools (10% house take)</li>
                    <li>Skill Rating Bonuses: +25/+15/+10 rating for top 3</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ODDS MODEL */}
        <TabsContent value="odds">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Odds Calculation Model v1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="text-amber-400 font-bold mb-2">🎲 Scientific Basis</h3>
                <p className="mb-2">Based on real-world pari-mutuel racing odds with three factors:</p>
                <ol className="list-decimal ml-6 space-y-2 text-sm">
                  <li><strong>Skill Rating (Base):</strong> ELO-style rating system, starting at 1000</li>
                  <li><strong>Form (Win Rate):</strong> Recent performance over last N races</li>
                  <li><strong>Consistency (Place/Show Rate):</strong> Ability to finish in top 3</li>
                </ol>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">📐 Mathematical Formula</h3>
                <div className="bg-slate-800 rounded p-4 font-mono text-xs space-y-2">
                  <p className="text-purple-400">// Step 1: Base Probability from Skill</p>
                  <p>totalSkill = Σ(all horses' skill ratings)</p>
                  <p>baseProb = horseSkill / totalSkill</p>
                  
                  <p className="text-purple-400 mt-3">// Step 2: Form Adjustment (Recent Performance)</p>
                  <p>winRate = wins / totalRaces</p>
                  <p>formAdjustment = winRate × 0.20  // Up to 20% boost</p>
                  
                  <p className="text-purple-400 mt-3">// Step 3: Consistency Bonus</p>
                  <p>placeRate = (places + shows) / totalRaces</p>
                  <p>consistencyBonus = placeRate × 0.10  // Up to 10% boost</p>
                  
                  <p className="text-purple-400 mt-3">// Step 4: Final Probability (Capped)</p>
                  <p>adjustedProb = min(0.95, max(0.05, baseProb + formAdjustment + consistencyBonus))</p>
                  
                  <p className="text-purple-400 mt-3">// Step 5: Convert to Odds</p>
                  <p>decimalOdds = 1 / adjustedProb</p>
                  <p>fractionalOdds = decimalOdds - 1  // Display as X:1</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🆕 Unrated Horse Behavior</h3>
                <div className="bg-orange-900/20 border border-orange-700/50 rounded p-3">
                  <p className="font-bold mb-2">Horses with &lt; 3 races are "Unrated"</p>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>Display: "Unrated" instead of odds</li>
                    <li>Reasoning: Insufficient data for accurate probability</li>
                    <li>Still compete with base 1000 skill rating</li>
                    <li>Create uncertainty → excitement for spectators</li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">Real-world parallel: First-time racehorses often have wide odds due to unknown capability</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">📊 Example Calculation</h3>
                <div className="bg-slate-800 rounded p-3 text-xs">
                  <p className="font-bold text-white mb-2">Race: 4 horses competing</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400">
                        <th>Horse</th>
                        <th>Skill</th>
                        <th>W/R</th>
                        <th>P/S Rate</th>
                        <th>Final Prob</th>
                        <th>Odds</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <tr>
                        <td>Thunder</td>
                        <td>1100</td>
                        <td>40%</td>
                        <td>70%</td>
                        <td>35%</td>
                        <td className="text-amber-400">1.9:1</td>
                      </tr>
                      <tr>
                        <td>Lightning</td>
                        <td>1050</td>
                        <td>30%</td>
                        <td>60%</td>
                        <td>31%</td>
                        <td className="text-amber-400">2.2:1</td>
                      </tr>
                      <tr>
                        <td>Storm</td>
                        <td>1000</td>
                        <td>20%</td>
                        <td>50%</td>
                        <td>26%</td>
                        <td className="text-amber-400">2.8:1</td>
                      </tr>
                      <tr>
                        <td>Breeze</td>
                        <td>950</td>
                        <td>0%</td>
                        <td>0%</td>
                        <td className="text-orange-400">Unrated</td>
                        <td className="text-slate-500">—</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-slate-400 mt-2">Note: Probabilities don't sum to 100% when unrated horses present</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MOMENTUM */}
        <TabsContent value="momentum">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Momentum Proof System v1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="text-amber-400 font-bold mb-2">⚡ Concept</h3>
                <p>Owners can influence their horse's performance during a race by submitting "momentum proofs" – active engagement that translates to a small win chance boost.</p>
                <div className="bg-purple-900/20 border border-purple-700/50 rounded p-3 mt-2 text-sm">
                  <p><strong>Real-world parallel:</strong> Jockey skill, crowd energy, horse temperament affecting race-day performance beyond raw stats</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🔬 Technical Implementation</h3>
                <div className="bg-slate-800 rounded p-4 font-mono text-xs space-y-2">
                  <p className="text-purple-400">// Step 1: Count Proofs</p>
                  <p>Each owner clicks "Submit Proof" during race.status === 'running'</p>
                  <p>entry.momentum_proofs++  // Simple counter</p>
                  
                  <p className="text-purple-400 mt-3">// Step 2: Normalize Across All Entries</p>
                  <p>totalProofs = Σ(all entries' momentum_proofs)</p>
                  <p>normalizedScore = (thisEntryProofs / totalProofs) × 10</p>
                  <p className="text-slate-500">// Scales to 0-10 range, relative to competition</p>
                  
                  <p className="text-purple-400 mt-3">// Step 3: Apply Cap</p>
                  <p>momentumImpactCap = 8  // Default: max 8% boost</p>
                  <p>cappedScore = min(normalizedScore, momentumImpactCap)</p>
                  
                  <p className="text-purple-400 mt-3">// Step 4: Use in Race Resolution</p>
                  <p>finalScore = random() + (skillRating/10000) + (cappedScore/100)</p>
                  <p className="text-slate-500">// Momentum converts to 0-8% additive boost</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">📊 Normalization Science</h3>
                <p className="mb-2">Why normalize? Prevents "proof spam" from dominating:</p>
                <div className="bg-slate-800 rounded p-3">
                  <p className="text-sm mb-2"><strong>Without normalization:</strong></p>
                  <ul className="list-disc ml-6 text-xs space-y-1 text-slate-400">
                    <li>Owner A: 100 proofs = 100 score (overpowered)</li>
                    <li>Owner B: 10 proofs = 10 score</li>
                  </ul>
                  <p className="text-sm mt-3 mb-2"><strong>With normalization (score out of 10):</strong></p>
                  <ul className="list-disc ml-6 text-xs space-y-1 text-green-400">
                    <li>Owner A: 100/110 × 10 = 9.09 score</li>
                    <li>Owner B: 10/110 × 10 = 0.91 score</li>
                    <li>Relative effort matters, not absolute spam</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">⚖️ Balance Mechanics</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-slate-800 rounded p-2">
                    <p className="font-bold text-white">Cap @ 8%</p>
                    <p className="text-xs text-slate-400">Even max proofs can't guarantee win. Skill + RNG still primary factors.</p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="font-bold text-white">3-second cooldown</p>
                    <p className="text-xs text-slate-400">Prevents button mashing. Requires sustained attention.</p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="font-bold text-white">Real-time recalc</p>
                    <p className="text-xs text-slate-400">Every proof submission recalculates ALL entries' scores for fairness.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🎯 Example Scenario</h3>
                <div className="bg-slate-800 rounded p-3 text-xs">
                  <p className="font-bold mb-2">Race Duration: 60 seconds | Cap: 8%</p>
                  <table className="w-full text-left mt-2">
                    <thead>
                      <tr className="text-slate-400">
                        <th>Owner</th>
                        <th>Proofs</th>
                        <th>Normalized</th>
                        <th>Capped</th>
                        <th>Boost</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <tr>
                        <td>Alice</td>
                        <td>15</td>
                        <td>6.25</td>
                        <td>6.25</td>
                        <td className="text-purple-400">+6.25%</td>
                      </tr>
                      <tr>
                        <td>Bob</td>
                        <td>20</td>
                        <td>8.33</td>
                        <td className="text-amber-400">8.00</td>
                        <td className="text-purple-400">+8.00%</td>
                      </tr>
                      <tr>
                        <td>Carol</td>
                        <td>5</td>
                        <td>2.08</td>
                        <td>2.08</td>
                        <td className="text-purple-400">+2.08%</td>
                      </tr>
                      <tr>
                        <td>Dave</td>
                        <td>8</td>
                        <td>3.33</td>
                        <td>3.33</td>
                        <td className="text-purple-400">+3.33%</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-slate-400 mt-2">Total proofs: 48 | Bob hits cap, gains no advantage from further proofs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TECHNICAL */}
        <TabsContent value="technical">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Technical Implementation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="text-amber-400 font-bold mb-2">🗄️ Data Model</h3>
                <div className="bg-slate-800 rounded p-3 text-xs font-mono space-y-3">
                  <div>
                    <p className="text-green-400 font-bold">RaceConfig (singleton)</p>
                    <pre className="text-slate-400 ml-4">
derby_enabled, owner_license_cost, max_horses_per_owner
duel/sprint/main_event_entry_fees
min/max_bet_amount, house_take_percentage
owner_purse_win/place/show_percentage
momentum_impact_cap, race_duration_seconds
cutoff_before_start_seconds, min_players_to_start</pre>
                  </div>

                  <div>
                    <p className="text-green-400 font-bold">OwnerLicense</p>
                    <pre className="text-slate-400 ml-4">
player_id, license_type, cost_paid, active, expires_at
total_races_entered, total_wins, total_earnings</pre>
                  </div>

                  <div>
                    <p className="text-green-400 font-bold">RaceHorse</p>
                    <pre className="text-slate-400 ml-4">
owner_id, horse_name, skill_rating (starts 1000)
races_entered, wins, places, shows, total_earnings
retired, avatar_emoji</pre>
                  </div>

                  <div>
                    <p className="text-green-400 font-bold">RaceEvent</p>
                    <pre className="text-slate-400 ml-4">
race_type (duel/sprint/main), race_number, max_horses
entry_fee, status (open/locked/running/completed)
starts_at, cutoff_at, completed_at
total_owner_purse, total_win/place/show_pool
entered_horses[], server_seed_hash, server_seed_revealed
winning/second/third_horse_id</pre>
                  </div>

                  <div>
                    <p className="text-green-400 font-bold">RaceEntry</p>
                    <pre className="text-slate-400 ml-4">
race_id, horse_id, owner_id, entry_fee_paid
lane_number, final_position, payout
momentum_proofs, momentum_score</pre>
                  </div>

                  <div>
                    <p className="text-green-400 font-bold">RaceBet</p>
                    <pre className="text-slate-400 ml-4">
race_id, player_id, horse_id, bet_type (win/place/show)
amount, odds_at_time, status (active/won/lost), payout</pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🔄 Race Resolution Algorithm</h3>
                <div className="bg-slate-800 rounded p-4 font-mono text-xs space-y-2">
                  <p className="text-purple-400">// Called by completeRace backend function</p>
                  <p className="text-slate-500">// Triggered when race.status transitions to 'running' → 'completed'</p>
                  
                  <p className="text-purple-400 mt-3">1. Fetch all entries + horses</p>
                  <p>const entries = await RaceEntry.filter({'{race_id}'})</p>
                  <p>const horses = await Promise.all(entries.map(e → RaceHorse.get(e.horse_id)))</p>
                  
                  <p className="text-purple-400 mt-3">2. Calculate final scores</p>
                  <pre className="text-slate-400">
results = entries.map((entry, idx) → ({'{'}
  ...entry,
  horse: horses[idx],
  finalScore: Math.random()  // Base RNG
    + (horse.skill_rating / 10000)  // Skill component
    + (entry.momentum_score / 100)  // Momentum component
{'}'}))</pre>
                  
                  <p className="text-purple-400 mt-3">3. Sort by score, assign positions</p>
                  <p>results.sort((a,b) → b.finalScore - a.finalScore)</p>
                  <p>winner = results[0], second = results[1], third = results[2]</p>
                  
                  <p className="text-purple-400 mt-3">4. Distribute owner purse</p>
                  <p>winPayout = totalPurse × 0.60</p>
                  <p>placePayout = totalPurse × 0.30</p>
                  <p>showPayout = totalPurse × 0.10</p>
                  <p className="text-slate-500">// Update player balances + ledger entries</p>
                  
                  <p className="text-purple-400 mt-3">5. Distribute betting payouts</p>
                  <p>For each pool (win/place/show):</p>
                  <pre className="text-slate-400">
  afterHouse = pool × (1 - houseTake)
  winningBets = bets matching top N horses
  payout per bet = (betAmount / totalWinningAmount) × afterHouse</pre>
                  
                  <p className="text-purple-400 mt-3">6. Update skill ratings</p>
                  <p>winner.skill_rating += 25</p>
                  <p>second.skill_rating += 15</p>
                  <p>third.skill_rating += 10</p>
                  
                  <p className="text-purple-400 mt-3">7. Create announcements (Main Events)</p>
                  <p>if (race.max_horses === 6 && winPayout ≥ 50k):</p>
                  <p className="ml-4">Announcement.create({'{type: "big_win", ...}'})</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🔒 Security & Fairness</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold">✓ Server-side RNG</p>
                    <p className="text-xs text-slate-400">All race resolution happens in backend function, not client-side</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold">✓ Committed Seed (future)</p>
                    <p className="text-xs text-slate-400">server_seed_hash published before race, revealed after (provably fair)</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold">✓ Atomic Transactions</p>
                    <p className="text-xs text-slate-400">All payouts happen in single backend execution, no partial states</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold">✓ Betting Cutoff</p>
                    <p className="text-xs text-slate-400">No bets allowed once race locked, prevents outcome manipulation</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold">✓ Owner Restriction</p>
                    <p className="text-xs text-slate-400">Owners cannot bet on races their horses are in (conflict of interest)</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">📡 Real-time Updates</h3>
                <div className="bg-slate-800 rounded p-3 text-xs">
                  <p className="mb-2">React Query with 3-second polling:</p>
                  <pre className="text-slate-400">
useQuery({'{'}
  queryKey: ['race', raceId],
  refetchInterval: 3000,  // Poll every 3s
{'}'})</pre>
                  <p className="mt-2 text-slate-500">Updates race status, pool totals, entries, momentum scores in near real-time</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🎨 UI/UX Flow</h3>
                <ol className="list-decimal ml-6 space-y-2 text-sm">
                  <li><strong>DerbyLobby:</strong> Browse open races, check license status, see race types</li>
                  <li><strong>DerbyStable:</strong> Purchase license, create horses (max 3), view stats</li>
                  <li><strong>DerbyEnter:</strong> Select horse, choose race, pay entry fee</li>
                  <li><strong>DerbyRace:</strong> View odds, place bets (spectators), submit proofs (owners)</li>
                  <li><strong>DerbyRaceShare:</strong> Shareable result page with podium, stats</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADMIN */}
        <TabsContent value="admin">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Admin Dashboard & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="text-amber-400 font-bold mb-2">🎛️ Admin Access</h3>
                <p className="mb-2">Derby system includes a comprehensive admin dashboard for real-time configuration:</p>
                <div className="bg-slate-800 rounded p-3 text-sm">
                  <p className="font-bold text-white mb-2">Navigation:</p>
                  <p className="font-mono text-xs">Admin → Game Settings → Flagship Platform Games → Derby Racetrack</p>
                  <p className="text-slate-400 mt-2 text-xs">Access restricted to users with <span className="text-amber-400">is_admin=true</span> or role='admin'</p>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">⚙️ Configuration Tabs</h3>
                <div className="space-y-3">
                  <div className="bg-slate-800 rounded p-3">
                    <p className="font-bold text-white mb-1">General Settings</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Enable/Disable Derby System (master toggle)</li>
                      <li>Owner License Cost (default: 50,000 pts)</li>
                      <li>Max Horses Per Owner (default: 3)</li>
                      <li>Race Duration (default: 60 seconds)</li>
                      <li>Momentum Impact Cap (default: 8%)</li>
                    </ul>
                  </div>

                  <div className="bg-slate-800 rounded p-3">
                    <p className="font-bold text-white mb-1">Fees & Entry</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Duel Entry Fee (2-horse races, default: 5,000)</li>
                      <li>Sprint Entry Fee (4-horse races, default: 10,000)</li>
                      <li>Main Event Entry Fee (6-horse races, default: 20,000)</li>
                    </ul>
                  </div>

                  <div className="bg-slate-800 rounded p-3">
                    <p className="font-bold text-white mb-1">Betting</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Minimum Bet Amount (default: 100 pts)</li>
                      <li>Maximum Bet Amount (default: 50,000 pts)</li>
                      <li>House Take Percentage (default: 10%)</li>
                    </ul>
                  </div>

                  <div className="bg-slate-800 rounded p-3">
                    <p className="font-bold text-white mb-1">Payouts</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Win (1st Place) % (default: 60%)</li>
                      <li>Place (2nd Place) % (default: 30%)</li>
                      <li>Show (3rd Place) % (default: 10%)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">📊 Live Statistics</h3>
                <div className="bg-slate-800 rounded p-3 text-sm">
                  <p className="mb-2">Dashboard displays real-time metrics:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Active Races count</li>
                    <li>Owner License Cost display</li>
                    <li>System Status (Active/Disabled)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🎨 UI Components</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold text-white">DerbyLobby</p>
                    <p className="text-xs text-slate-400">Main entry - browse races, view roles, see race types</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold text-white">DerbyStable</p>
                    <p className="text-xs text-slate-400">Manage horses, purchase license, view stats</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold text-white">DerbyEnter</p>
                    <p className="text-xs text-slate-400">Select horse, choose race type, pay entry fee</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold text-white">DerbyRace</p>
                    <p className="text-xs text-slate-400">Live race view with odds, betting slip, momentum tracker</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold text-white">DerbyRaceShare</p>
                    <p className="text-xs text-slate-400">Shareable results page with podium and stats</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-2">
                    <p className="font-bold text-white">DerbyAdmin</p>
                    <p className="text-xs text-slate-400">Full admin dashboard with tabbed configuration</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🔄 Hot-Reload Configuration</h3>
                <div className="bg-slate-800 rounded p-3 text-sm">
                  <p className="mb-2">All changes take effect immediately:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>No server restart required</li>
                    <li>Existing races unaffected</li>
                    <li>New races use updated config</li>
                    <li>React Query auto-invalidates cached data</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold mb-2">🛡️ Admin Best Practices</h3>
                <div className="bg-orange-900/20 border border-orange-700/50 rounded p-3 text-sm">
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Test Changes:</strong> Adjust values incrementally, monitor impact</li>
                    <li><strong>Entry Fees:</strong> Balance purse sizes with player affordability</li>
                    <li><strong>House Take:</strong> 10% is standard; lower = more to bettors, higher = more revenue</li>
                    <li><strong>Momentum Cap:</strong> Keep at 5-10% to prevent proof spam dominance</li>
                    <li><strong>Bet Limits:</strong> Set max to prevent single-bet pool manipulation</li>
                    <li><strong>License Cost:</strong> Should be achievable but meaningful investment</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Summary */}
      <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/50">
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-black text-white mb-2">🏆 System Summary</h3>
          <p className="text-slate-300 text-sm mb-4">
            A multiplayer horseracing platform combining ELO-based skill ratings, pari-mutuel betting pools, 
            normalized momentum proofs, and dual economy (owner purses + spectator payouts) with provably fair race resolution.
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/50 rounded p-2">
              <p className="text-amber-400 font-bold">3 Race Types</p>
              <p className="text-slate-400">2/4/6 horses</p>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <p className="text-amber-400 font-bold">3 Bet Types</p>
              <p className="text-slate-400">Win/Place/Show</p>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <p className="text-amber-400 font-bold">2 Roles</p>
              <p className="text-slate-400">Owner/Spectator</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}