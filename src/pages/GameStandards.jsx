import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Code, Palette, Database, Shield, Settings, TrendingUp, FileCode } from 'lucide-react';

export default function GameStandards() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Admin')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <FileCode className="w-8 h-8 text-purple-500" />
              Game Development Standards
            </h1>
            <p className="text-slate-400">Platform guidelines for building casino games</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 mb-6 flex-wrap h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="structure" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Structure
            </TabsTrigger>
            <TabsTrigger value="variables" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Variables
            </TabsTrigger>
            <TabsTrigger value="visuals" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Visuals & UI
            </TabsTrigger>
            <TabsTrigger value="fairness" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Fairness
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Tracking
            </TabsTrigger>
            <TabsTrigger value="controls" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              House Controls
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code className="w-5 h-5 text-purple-400" />
                    Platform Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-300">
                  <p>
                    All games on this platform follow consistent standards to ensure fairness, 
                    maintainability, and a cohesive user experience. These guidelines apply to 
                    slots, card games, dice games, and any future game additions.
                  </p>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-purple-300 font-bold mb-2">Core Principles</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span><strong>Provably Fair:</strong> All outcomes use deterministic RNG with client + server seeds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span><strong>House Controllable:</strong> All parameters adjustable via HouseConfig entity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span><strong>Tracked & Auditable:</strong> Every game creates session and ledger records</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span><strong>Responsive Design:</strong> Works seamlessly on mobile and desktop</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-2">Frontend Component</h4>
                      <p className="text-sm text-slate-400">
                        React component in <code className="bg-slate-700 px-1 rounded">components/casino/</code> handles 
                        UI, animations, and calls backend function
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-2">Backend Function</h4>
                      <p className="text-sm text-slate-400">
                        Deno function in <code className="bg-slate-700 px-1 rounded">functions/</code> handles 
                        game logic, RNG, balance updates, and records
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Structure Tab */}
          <TabsContent value="structure">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Required Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-300">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-bold mb-2">1. Game Entity (Session Tracker)</h3>
                      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                        <p>Entity: <code className="bg-slate-700 px-2 py-1 rounded">[GameName]Session</code></p>
                        <p className="text-slate-400">Stores every game round with complete details for auditing and verification.</p>
                        <div className="mt-3">
                          <p className="text-slate-500 text-xs mb-2">Required Fields:</p>
                          <div className="grid md:grid-cols-2 gap-2">
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">player_id (string)</Badge>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">bet_amount (number)</Badge>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">payout (number)</Badge>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">net_result (number)</Badge>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">client_seed (string)</Badge>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">server_seed_hash (string)</Badge>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">nonce (number)</Badge>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-300">game_data (object)</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-bold mb-2">2. Backend Function</h3>
                      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                        <p>File: <code className="bg-slate-700 px-2 py-1 rounded">functions/[gameName].js</code></p>
                        <p className="text-slate-400">Handles game logic, RNG, balance updates, and record creation.</p>
                        <div className="mt-3">
                          <p className="text-slate-500 text-xs mb-2">Required Logic:</p>
                          <ul className="space-y-1 text-slate-400">
                            <li>• Authenticate user via <code className="bg-slate-700 px-1 rounded">base44.auth.me()</code></li>
                            <li>• Validate bet amount against HouseConfig limits</li>
                            <li>• Check player balance</li>
                            <li>• Generate provably fair outcome (server seed + client seed + nonce)</li>
                            <li>• Update player balance and stats</li>
                            <li>• Create session record</li>
                            <li>• Create ledger entries (bet + win/loss)</li>
                            <li>• Return outcome data to frontend</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-bold mb-2">3. Frontend Component</h3>
                      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                        <p>File: <code className="bg-slate-700 px-2 py-1 rounded">components/casino/[GameName].jsx</code></p>
                        <p className="text-slate-400">UI component with betting controls, game display, and animations.</p>
                        <div className="mt-3">
                          <p className="text-slate-500 text-xs mb-2">Required Features:</p>
                          <ul className="space-y-1 text-slate-400">
                            <li>• Bet amount input with quick select buttons</li>
                            <li>• Manual text input for precise bet amounts</li>
                            <li>• Slider with visible min/max labels</li>
                            <li>• Play/action button disabled during animation</li>
                            <li>• Result display with win/loss indication</li>
                            <li>• Smooth animations using framer-motion</li>
                            <li>• Loading states</li>
                            <li>• Error handling</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-bold mb-2">4. HouseConfig Fields</h3>
                      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                        <p className="text-slate-400">Add game-specific controls to HouseConfig entity:</p>
                        <div className="mt-3 space-y-2">
                          <code className="block bg-slate-700 px-3 py-1 rounded text-xs">[game]_enabled (boolean)</code>
                          <code className="block bg-slate-700 px-3 py-1 rounded text-xs">[game]_min_bet (number)</code>
                          <code className="block bg-slate-700 px-3 py-1 rounded text-xs">[game]_max_bet (number)</code>
                          <p className="text-slate-500 text-xs mt-2">Plus any game-specific parameters (e.g., plinko_rows, slots_jackpot_enabled)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    Standard Variables & Naming
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-slate-300">
                  <div>
                    <h3 className="text-white font-bold mb-3">Player Stats (Player Entity)</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <code className="text-cyan-400">points_balance</code>
                          <p className="text-slate-400 text-xs">Current player balance</p>
                        </div>
                        <div>
                          <code className="text-cyan-400">total_wagered</code>
                          <p className="text-slate-400 text-xs">Lifetime total bet</p>
                        </div>
                        <div>
                          <code className="text-cyan-400">total_won</code>
                          <p className="text-slate-400 text-xs">Lifetime total winnings</p>
                        </div>
                        <div>
                          <code className="text-cyan-400">games_played</code>
                          <p className="text-slate-400 text-xs">Total games across all types</p>
                        </div>
                        <div>
                          <code className="text-cyan-400">biggest_win</code>
                          <p className="text-slate-400 text-xs">Largest single win</p>
                        </div>
                        <div>
                          <code className="text-cyan-400">[game]_games_played</code>
                          <p className="text-slate-400 text-xs">Game-specific count</p>
                        </div>
                        <div>
                          <code className="text-cyan-400">[game]_nonce</code>
                          <p className="text-slate-400 text-xs">RNG nonce for fairness</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Session Record Variables</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <code className="text-cyan-400 whitespace-nowrap">bet_amount</code>
                          <span className="text-slate-400">Total amount wagered in this round</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <code className="text-cyan-400 whitespace-nowrap">payout</code>
                          <span className="text-slate-400">Total amount paid out (including bet if push)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <code className="text-cyan-400 whitespace-nowrap">net_result</code>
                          <span className="text-slate-400">Profit/loss (payout - bet_amount)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <code className="text-cyan-400 whitespace-nowrap">multiplier</code>
                          <span className="text-slate-400">Win multiplier applied</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Ledger Transaction Reasons</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-2">
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">game_bet</Badge>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">game_win</Badge>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">jackpot_contrib</Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">jackpot_win</Badge>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">daily_bonus</Badge>
                        <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">admin_adjustment</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visuals Tab */}
          <TabsContent value="visuals">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-pink-400" />
                    Visual Design Standards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-slate-300">
                  <div>
                    <h3 className="text-white font-bold mb-3">Color Schemes</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-4">
                        <h4 className="text-purple-300 font-bold mb-2">Slots</h4>
                        <p className="text-sm text-slate-400">Purple/Pink gradient theme</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-purple-500" />
                            <span>Primary: purple-500</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-pink-500" />
                            <span>Accent: pink-500</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-700/50 rounded-lg p-4">
                        <h4 className="text-emerald-300 font-bold mb-2">Blackjack</h4>
                        <p className="text-sm text-slate-400">Emerald/Green gradient theme</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-emerald-500" />
                            <span>Primary: emerald-500</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500" />
                            <span>Accent: green-500</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 border border-orange-700/50 rounded-lg p-4">
                        <h4 className="text-orange-300 font-bold mb-2">Plinko</h4>
                        <p className="text-sm text-slate-400">Orange/Amber gradient theme</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-500" />
                            <span>Primary: orange-500</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-amber-500" />
                            <span>Accent: amber-500</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">UI Components</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <div>
                        <h4 className="text-white font-semibold text-sm mb-2">Betting Controls</h4>
                        <ul className="space-y-1 text-sm text-slate-400">
                          <li>• Quick select buttons: [1, 5, 10, 25, 50, 100] + MAX</li>
                          <li>• Manual number input field (right-aligned, focused ring color matches theme)</li>
                          <li>• Large visible slider with colored thumb (h-5 w-5)</li>
                          <li>• Min/max labels below slider in text-xs</li>
                          <li>• All controls disabled during game play</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold text-sm mb-2">Action Buttons</h4>
                        <ul className="space-y-1 text-sm text-slate-400">
                          <li>• Large primary button (h-14, text-xl, font-black)</li>
                          <li>• Gradient background matching game theme</li>
                          <li>• Shadow effect with theme color</li>
                          <li>• Loading spinner when processing</li>
                          <li>• Disabled state with reduced opacity</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold text-sm mb-2">Result Display</h4>
                        <ul className="space-y-1 text-sm text-slate-400">
                          <li>• Animated entry/exit with framer-motion</li>
                          <li>• Green gradient for wins, red for losses, amber for push</li>
                          <li>• Large bold text showing win amount</li>
                          <li>• Breakdown of line wins or multipliers</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold text-sm mb-2">Layout Structure</h4>
                        <ul className="space-y-1 text-sm text-slate-400">
                          <li>• Fixed height containers to prevent button jumping</li>
                          <li>• Consistent spacing using Tailwind spacing scale</li>
                          <li>• Responsive breakpoints (sm:, md:, lg:)</li>
                          <li>• Mobile-first design approach</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Typography</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <code className="text-cyan-400">font-black</code>
                        <span className="text-slate-400">For titles and big numbers</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="text-cyan-400">font-bold</code>
                        <span className="text-slate-400">For section headers</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="text-cyan-400">font-semibold</code>
                        <span className="text-slate-400">For button text</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="text-cyan-400">font-medium</code>
                        <span className="text-slate-400">For labels</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fairness Tab */}
          <TabsContent value="fairness">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Provably Fair System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-slate-300">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-300 font-bold mb-2">All games MUST be provably fair</p>
                    <p className="text-sm text-slate-400">
                      Every outcome is deterministic and verifiable using cryptographic hashing. 
                      Players can verify results weren't manipulated.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Required Components</h3>
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-cyan-400 font-semibold mb-2">1. Client Seed</h4>
                        <p className="text-sm text-slate-400 mb-2">
                          Generated by frontend, controlled by player. Ensures house can't predict outcomes.
                        </p>
                        <code className="block bg-slate-900 px-3 py-2 rounded text-xs text-green-300 mt-2">
                          const clientSeed = Math.random().toString(36).substring(7);
                        </code>
                        <p className="text-xs text-slate-500 mt-2">
                          New seed generated after each game. Displayed to player for verification.
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-cyan-400 font-semibold mb-2">2. Server Seed</h4>
                        <p className="text-sm text-slate-400 mb-2">
                          Generated by backend, never revealed until after game. Only hash is shown.
                        </p>
                        <code className="block bg-slate-900 px-3 py-2 rounded text-xs text-green-300 mt-2">
                          const serverSeed = crypto.randomUUID();<br/>
                          const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
                        </code>
                        <p className="text-xs text-slate-500 mt-2">
                          Hash stored in session record for verification.
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-cyan-400 font-semibold mb-2">3. Nonce</h4>
                        <p className="text-sm text-slate-400 mb-2">
                          Incrementing counter per player. Ensures each game has unique outcome.
                        </p>
                        <code className="block bg-slate-900 px-3 py-2 rounded text-xs text-green-300 mt-2">
                          const nonce = (player.[game]_nonce || 0) + 1;
                        </code>
                        <p className="text-xs text-slate-500 mt-2">
                          Stored in Player entity as <code className="bg-slate-700 px-1 rounded">[game]_nonce</code>
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-cyan-400 font-semibold mb-2">4. Combined Seed</h4>
                        <p className="text-sm text-slate-400 mb-2">
                          All three components hashed together to generate outcome.
                        </p>
                        <code className="block bg-slate-900 px-3 py-2 rounded text-xs text-green-300 mt-2">
                          const combinedSeed = crypto.createHash('sha256')<br/>
                          &nbsp;&nbsp;.update(`$&#123;serverSeed&#125;:$&#123;clientSeed&#125;:$&#123;nonce&#125;`)<br/>
                          &nbsp;&nbsp;.digest('hex');
                        </code>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-cyan-400 font-semibold mb-2">5. Outcome Generation</h4>
                        <p className="text-sm text-slate-400 mb-2">
                          Use combined seed to generate deterministic random numbers.
                        </p>
                        <code className="block bg-slate-900 px-3 py-2 rounded text-xs text-green-300 mt-2">
                          const hash = crypto.createHash('sha256').update(combinedSeed).digest('hex');<br/>
                          const value = parseInt(hash.substring(0, 8), 16);<br/>
                          const random = value / 0xffffffff; // 0 to 1
                        </code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Session Record</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400 mb-3">
                        Every game session MUST store these fields for verification:
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">client_seed</Badge>
                          <span className="text-slate-400">Player's seed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">server_seed_hash</Badge>
                          <span className="text-slate-400">Hash of server seed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">nonce</Badge>
                          <span className="text-slate-400">Game number for this player</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">game_data</Badge>
                          <span className="text-slate-400">Complete game result (reels, cards, path, etc.)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Data Tracking & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-slate-300">
                  <div>
                    <h3 className="text-white font-bold mb-3">Player Stats Updates</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400 mb-3">Every game MUST update these Player entity fields:</p>
                      <div className="space-y-3 text-sm">
                        <div>
                          <code className="text-amber-400">points_balance</code>
                          <p className="text-slate-500 text-xs">+= net_result (after game completes)</p>
                        </div>
                        <div>
                          <code className="text-amber-400">total_wagered</code>
                          <p className="text-slate-500 text-xs">+= bet_amount</p>
                        </div>
                        <div>
                          <code className="text-amber-400">total_won</code>
                          <p className="text-slate-500 text-xs">+= payout (if win)</p>
                        </div>
                        <div>
                          <code className="text-amber-400">games_played</code>
                          <p className="text-slate-500 text-xs">+= 1</p>
                        </div>
                        <div>
                          <code className="text-amber-400">biggest_win</code>
                          <p className="text-slate-500 text-xs">= Math.max(biggest_win, payout)</p>
                        </div>
                        <div>
                          <code className="text-amber-400">xp</code>
                          <p className="text-slate-500 text-xs">+= Math.floor(bet_amount / 10) + (win ? 15 : 0)</p>
                        </div>
                        <div>
                          <code className="text-amber-400">level</code>
                          <p className="text-slate-500 text-xs">= Math.floor(xp / 500) + 1</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Game-Specific Stats</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 text-sm">
                      <p className="text-slate-400">Add game-specific tracking to Player entity:</p>
                      <div className="grid md:grid-cols-2 gap-2">
                        <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">[game]_games_played</code>
                        <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">[game]_total_bet</code>
                        <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">[game]_wins</code>
                        <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">[game]_current_streak</code>
                        <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">[game]_longest_streak</code>
                        <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">[game]_nonce</code>
                      </div>
                      <p className="text-slate-500 text-xs mt-2">
                        Example: blackjack_games_played, slots_total_bet, plinko_drops
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Ledger Entries</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-slate-400">Create TWO ledger entries per game:</p>
                      
                      <div className="border border-red-500/30 rounded p-3">
                        <h4 className="text-red-300 font-semibold text-sm mb-2">1. Bet Entry</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex gap-2"><span className="text-slate-500">change:</span><span className="text-red-400">-bet_amount</span></div>
                          <div className="flex gap-2"><span className="text-slate-500">reason:</span><span className="text-slate-300">"game_bet"</span></div>
                          <div className="flex gap-2"><span className="text-slate-500">balance_after:</span><span className="text-slate-300">balance - bet_amount</span></div>
                        </div>
                      </div>

                      <div className="border border-green-500/30 rounded p-3">
                        <h4 className="text-green-300 font-semibold text-sm mb-2">2. Win/Loss Entry (if payout > 0)</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex gap-2"><span className="text-slate-500">change:</span><span className="text-green-400">+payout</span></div>
                          <div className="flex gap-2"><span className="text-slate-500">reason:</span><span className="text-slate-300">"game_win"</span></div>
                          <div className="flex gap-2"><span className="text-slate-500">balance_after:</span><span className="text-slate-300">final_balance</span></div>
                        </div>
                      </div>

                      <p className="text-slate-500 text-xs mt-2">
                        Both entries reference session_id for complete audit trail
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Optional Bonus Tracking</h3>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <p className="text-sm text-slate-400 mb-2">Games can implement additional bonus features:</p>
                      <ul className="space-y-1 text-sm text-slate-400">
                        <li>• Progressive jackpots (track contributions and wins)</li>
                        <li>• Achievement unlocks (track specific game milestones)</li>
                        <li>• Streak bonuses (consecutive wins)</li>
                        <li>• Time-based multipliers (happy hour, etc.)</li>
                        <li>• VIP tier benefits (higher max bets, special rewards)</li>
                      </ul>
                      <p className="text-xs text-slate-500 mt-3">
                        All bonus features should be toggle-able via HouseConfig
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    House Controls Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-slate-300">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-purple-300 font-bold mb-2">All game parameters MUST be controllable via admin dashboard</p>
                    <p className="text-sm text-slate-400">
                      Admins should be able to enable/disable games, adjust bet limits, and tune game mechanics 
                      without code changes.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Required HouseConfig Fields</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-purple-400 font-semibold mb-2">Master Toggle</h4>
                        <code className="block bg-slate-900 px-3 py-2 rounded text-sm text-green-300">
                          [game]_enabled: boolean (default: true)
                        </code>
                        <p className="text-xs text-slate-500 mt-2">
                          When false, game returns error and frontend shows "Game disabled" message
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-purple-400 font-semibold mb-2">Bet Limits</h4>
                        <div className="space-y-2">
                          <code className="block bg-slate-900 px-3 py-2 rounded text-sm text-green-300">
                            [game]_min_bet: number (default: 1)
                          </code>
                          <code className="block bg-slate-900 px-3 py-2 rounded text-sm text-green-300">
                            [game]_max_bet: number (default: 1000)
                          </code>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Backend validates bet_amount is within these limits
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-purple-400 font-semibold mb-2">Game-Specific Parameters</h4>
                        <p className="text-sm text-slate-400 mb-2">Examples from existing games:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex gap-2">
                            <code className="text-cyan-400">slots_target_rtp</code>
                            <span className="text-slate-500">- Target return to player %</span>
                          </div>
                          <div className="flex gap-2">
                            <code className="text-cyan-400">slots_jackpot_enabled</code>
                            <span className="text-slate-500">- Enable progressive jackpot</span>
                          </div>
                          <div className="flex gap-2">
                            <code className="text-cyan-400">plinko_rows</code>
                            <span className="text-slate-500">- Number of peg rows (8, 12, or 16)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Admin Dashboard Section</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 text-sm">
                      <p className="text-slate-400">Add game controls to HouseControls page with:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span><strong className="text-white">Toggle switch</strong> for enabled/disabled state</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span><strong className="text-white">Number inputs</strong> for min/max bet with validation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span><strong className="text-white">Sliders</strong> for percentage-based values (RTP, contribution, etc.)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span><strong className="text-white">Real-time stats</strong> showing current house edge and player activity</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Backend Validation</h3>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400 mb-3">Every backend function must check HouseConfig:</p>
                      <code className="block bg-slate-900 px-3 py-2 rounded text-xs text-green-300 whitespace-pre">
{`const configs = await base44.asServiceRole.entities.HouseConfig.list();
const houseConfig = configs[0];

if (!houseConfig?.game_enabled) {
  return Response.json({ error: 'Game disabled' }, { status: 403 });
}

if (bet_amount < houseConfig.game_min_bet || bet_amount > houseConfig.game_max_bet) {
  return Response.json({ error: 'Invalid bet amount' }, { status: 400 });
}`}
                      </code>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Live Updates</h3>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm text-slate-400">
                        HouseConfig changes take effect immediately on next game round. 
                        No server restart or code deployment needed. Frontend should periodically 
                        refetch config or subscribe to updates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}