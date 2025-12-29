import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Zap, Shield, Code, Palette, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SlotsBreakdown() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('GameSettings')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game Settings
            </Button>
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
            🎰 Slots Machine: Complete System Breakdown
          </h1>
          <p className="text-slate-400">Technical documentation for the 5×3 slot machine game system</p>
        </div>

        {/* Overview */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Game Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              The slot machine is a 5-reel, 3-row classic casino game with up to 5 configurable paylines. 
              Players can bet multiple amounts per line, and wins are calculated across active paylines.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Grid Size</p>
                <p className="text-white font-bold">5 reels × 3 rows = 15 symbols</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Paylines</p>
                <p className="text-white font-bold">1, 3, or 5 lines</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Symbol Types</p>
                <p className="text-white font-bold">8 symbols (6 regular + WILD + SCATTER)</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Special Features</p>
                <p className="text-white font-bold">WILD substitution, SCATTER bonus, Jackpot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Mechanics */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              Game Mechanics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <div>
              <h3 className="text-white font-bold mb-2">Symbol Set</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-800/30 p-2 rounded">🍋 Lemon (lowest value)</div>
                <div className="bg-slate-800/30 p-2 rounded">🍒 Cherry</div>
                <div className="bg-slate-800/30 p-2 rounded">🍇 Grape</div>
                <div className="bg-slate-800/30 p-2 rounded">🔔 Bell</div>
                <div className="bg-slate-800/30 p-2 rounded">💎 Diamond</div>
                <div className="bg-slate-800/30 p-2 rounded">7️⃣ Seven (highest value + jackpot)</div>
                <div className="bg-purple-500/20 p-2 rounded border border-purple-500/30">⭐ WILD (substitutes any except SCATTER)</div>
                <div className="bg-amber-500/20 p-2 rounded border border-amber-500/30">💰 SCATTER (pays anywhere)</div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">Payline Configuration</h3>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li><strong>Line 1 (Middle):</strong> Row 1 across all 5 reels [1,1,1,1,1]</li>
                <li><strong>Line 2 (Top):</strong> Row 0 across all 5 reels [0,0,0,0,0]</li>
                <li><strong>Line 3 (Bottom):</strong> Row 2 across all 5 reels [2,2,2,2,2]</li>
                <li><strong>Line 4 (V-Shape):</strong> [2,1,0,1,2] - starts bottom, goes to top center, returns bottom</li>
                <li><strong>Line 5 (Inverted V):</strong> [0,1,2,1,0] - starts top, goes to bottom center, returns top</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">Payout Structure (× Bet Per Line)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-slate-400">Symbol</th>
                      <th className="text-right py-2 text-slate-400">3 Match</th>
                      <th className="text-right py-2 text-slate-400">4 Match</th>
                      <th className="text-right py-2 text-slate-400">5 Match</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr className="border-b border-slate-800">
                      <td className="py-2">🍋 Lemon</td>
                      <td className="text-right">3×</td>
                      <td className="text-right">10×</td>
                      <td className="text-right">25×</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2">🍒 Cherry</td>
                      <td className="text-right">5×</td>
                      <td className="text-right">15×</td>
                      <td className="text-right">40×</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2">🍇 Grape</td>
                      <td className="text-right">8×</td>
                      <td className="text-right">20×</td>
                      <td className="text-right">60×</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2">🔔 Bell</td>
                      <td className="text-right">10×</td>
                      <td className="text-right">30×</td>
                      <td className="text-right">100×</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2">💎 Diamond</td>
                      <td className="text-right">15×</td>
                      <td className="text-right">50×</td>
                      <td className="text-right">200×</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2">7️⃣ Seven</td>
                      <td className="text-right">50×</td>
                      <td className="text-right">200×</td>
                      <td className="text-right font-bold text-amber-400">1000×</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-2">* WILD symbols substitute for any regular symbol to complete winning combinations</p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">SCATTER Bonus (× Total Bet)</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-center">
                  <p className="text-amber-400 font-bold">3 💰</p>
                  <p className="text-slate-300">10× total bet</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-center">
                  <p className="text-amber-400 font-bold">4 💰</p>
                  <p className="text-slate-300">50× total bet</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-center">
                  <p className="text-amber-400 font-bold">5 💰</p>
                  <p className="text-slate-300">250× total bet</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Jackpot System
              </h3>
              <p className="text-sm mb-2">Hitting 5× 7️⃣ symbols on any active payline awards the progressive jackpot!</p>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Jackpot pool grows from a percentage of all bets across the platform</li>
                <li>Jackpot win pays out the entire pool to the winner</li>
                <li>Pool resets to a seed amount after being won</li>
                <li>Can be enabled/disabled in house config</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* RNG & Fairness */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Provably Fair RNG System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              The slot machine uses a <strong className="text-white">provably fair</strong> random number generation system 
              that players can verify. Results are deterministic based on seeds and nonce.
            </p>
            
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-bold">RNG Inputs</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">1.</span>
                  <div>
                    <p className="text-white font-semibold">Client Seed (User-Generated)</p>
                    <p className="text-slate-400">Random string generated in browser, visible to player before spin</p>
                    <code className="text-xs bg-slate-900 px-2 py-1 rounded mt-1 block">Example: "a7f3d2k"</code>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">2.</span>
                  <div>
                    <p className="text-white font-semibold">Server Seed (Platform Secret)</p>
                    <p className="text-slate-400">Server-side secret unique to each player, never revealed directly</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">3.</span>
                  <div>
                    <p className="text-white font-semibold">Nonce (Spin Counter)</p>
                    <p className="text-slate-400">Incrementing counter for each spin to ensure unique results</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-white font-bold mb-2">Result Generation Process</h3>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Combine server_seed + client_seed + nonce into a single string</li>
                <li>Apply <code className="bg-slate-900 px-1 rounded">SHA-256</code> cryptographic hash function</li>
                <li>Convert hash output to numeric values using hexadecimal parsing</li>
                <li>Map numbers to symbol indices using modulo operation</li>
                <li>Generate all 15 grid positions (5 reels × 3 rows)</li>
              </ol>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm">
                <strong className="text-green-400">Verification:</strong> Players can independently verify any spin result 
                by using the same client seed, server seed (revealed after), and nonce to regenerate the exact grid.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Backend Logic */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Backend Function Logic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              The <code className="bg-slate-800 px-2 py-1 rounded text-cyan-400">spinSlots</code> backend function 
              handles all game logic, RNG, payout calculation, and player balance updates.
            </p>

            <div className="space-y-2">
              <h3 className="text-white font-bold">Function Flow</h3>
              <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 text-sm font-mono">
                <p><span className="text-cyan-400">1.</span> Authenticate user & fetch player data</p>
                <p><span className="text-cyan-400">2.</span> Validate bet amount & balance check</p>
                <p><span className="text-cyan-400">3.</span> Check if slots enabled in house config</p>
                <p><span className="text-cyan-400">4.</span> Deduct bet from player balance</p>
                <p><span className="text-cyan-400">5.</span> Generate 5×3 grid using provably fair RNG</p>
                <p><span className="text-cyan-400">6.</span> Calculate wins across all active paylines</p>
                <p><span className="text-cyan-400">7.</span> Check for SCATTER bonus (3+ anywhere)</p>
                <p><span className="text-cyan-400">8.</span> Check for jackpot win (5× 7️⃣ on line)</p>
                <p><span className="text-cyan-400">9.</span> Add winnings to player balance</p>
                <p><span className="text-cyan-400">10.</span> Update jackpot pool (add % of bet, pay out if won)</p>
                <p><span className="text-cyan-400">11.</span> Create ledger transaction record</p>
                <p><span className="text-cyan-400">12.</span> Increment player nonce</p>
                <p><span className="text-cyan-400">13.</span> Return result object with grid, wins, payouts</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-white font-bold mb-2">Response Object Structure</h3>
              <pre className="text-xs bg-slate-900 p-3 rounded overflow-x-auto">
{`{
  "grid": [
    ["🍋", "🍒", "💎"],  // Reel 1
    ["7️⃣", "🍇", "🔔"],  // Reel 2
    ["💰", "🍒", "🍋"],  // Reel 3
    ["🔔", "💎", "⭐"],  // Reel 4
    ["🍇", "7️⃣", "🍒"]   // Reel 5
  ],
  "total_bet": 25,        // bet_per_line × lines
  "total_win": 150,       // sum of all wins
  "net_result": 125,      // total_win - total_bet
  "line_wins": [
    {
      "line": 2,
      "symbol": "🍒",
      "count": 3,
      "payout": 50
    }
  ],
  "scatter_win": {
    "count": 3,
    "payout": 250
  },
  "jackpot_won": false,
  "jackpot_amount": 0,
  "server_seed_hash": "a3f7...",
  "nonce": 42
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* UI/UX Design */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-400" />
              UI/UX Implementation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div>
              <h3 className="text-white font-bold mb-2">Reel Animation System</h3>
              <p className="text-sm mb-2">
                Each reel column is an independent React component that manages its own animation state:
              </p>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li><strong>Spinning State:</strong> Rapidly cycles through random symbols (50ms interval)</li>
                <li><strong>Staggered Start:</strong> Each reel starts spinning with 100ms delay for cascade effect</li>
                <li><strong>Spin Duration:</strong> Normal mode: 1500ms, Fast mode: 300ms</li>
                <li><strong>Final Reveal:</strong> Animates to final position from backend result</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">Payline Visualization</h3>
              <p className="text-sm mb-2">
                Visual overlays show active paylines and winning combinations:
              </p>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li><strong>Active Lines:</strong> Faint colored lines show which paylines are active</li>
                <li><strong>Winning Lines:</strong> Bright glowing lines with pulsing animation</li>
                <li><strong>Symbol Highlighting:</strong> Winning symbols get amber border + scale effect</li>
                <li><strong>Color Coding:</strong> Each payline has unique color (amber, cyan, green, pink, purple)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">Result Display</h3>
              <p className="text-sm mb-2">
                Winning spins show an overlay card with result details:
              </p>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li><strong>Color Theme:</strong> Green for wins, red for losses, gold for jackpot</li>
                <li><strong>Breakdown:</strong> Shows each winning line with symbol, count, payout</li>
                <li><strong>SCATTER Display:</strong> Shows scatter count and bonus payout</li>
                <li><strong>Auto-Dismiss:</strong> Result card fades out after 1.2 seconds</li>
                <li><strong>Jackpot Celebration:</strong> Special sparkle animation + sound for jackpot wins</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">Control Panel</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Bet Per Line Control:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Number input field with min/max validation</li>
                  <li>Quick bet buttons (+1, +5, +10, +25, +50, +100)</li>
                  <li>Slider for visual adjustment</li>
                  <li>Clear button to reset to minimum</li>
                  <li>MAX button to bet maximum allowed (if enabled)</li>
                </ul>
                <p className="mt-2"><strong>Payline Selection:</strong> 3 buttons for 1, 3, or 5 lines</p>
                <p><strong>Speed Toggle:</strong> Normal vs Fast mode button</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Configuration */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Admin Configuration Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              Admins can configure the following slot machine parameters in the House Config:
            </p>
            
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">slots_enabled</p>
                <p className="text-slate-400">Enable/disable the game globally</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">min_bet_per_line</p>
                <p className="text-slate-400">Minimum bet per payline (default: 1)</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">max_bet_per_line</p>
                <p className="text-slate-400">Maximum bet per payline (default: 100)</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">jackpot_enabled</p>
                <p className="text-slate-400">Enable/disable jackpot feature</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">jackpot_pool</p>
                <p className="text-slate-400">Current jackpot pool size</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">jackpot_contribution_percentage</p>
                <p className="text-slate-400">% of each bet added to jackpot pool</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">max_bet_button_enabled</p>
                <p className="text-slate-400">Show/hide MAX bet button</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-cyan-400 font-semibold mb-1">slots_rtp_target</p>
                <p className="text-slate-400">Target Return to Player % (display only)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Notes */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Technical Notes & Considerations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-400 font-bold mb-1">RTP Calculation</p>
              <p>Return to Player is calculated based on symbol probabilities and payout table. The theoretical RTP is approximately 96-97% with optimal symbol distribution.</p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-400 font-bold mb-1">Volatility</p>
              <p>Medium-high volatility design with frequent small wins (fruit symbols) and rare large wins (Seven + Jackpot).</p>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-400 font-bold mb-1">Performance</p>
              <p>React component uses local state management and memoization to ensure smooth 60fps animations even on lower-end devices.</p>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-purple-400 font-bold mb-1">Security</p>
              <p>All game logic runs server-side. Client only handles UI/UX. RNG seeds are stored securely and never exposed to manipulation.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}