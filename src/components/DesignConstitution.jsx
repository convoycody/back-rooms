/**
 * THE BACKROOMS - DESIGN CONSTITUTION
 * 
 * This component serves as living documentation for all design patterns.
 * Reference this when building new features to maintain consistency.
 * 
 * CORE PRINCIPLES:
 * 1. Mobile-First: Single column layouts, touch-friendly (44px targets)
 * 2. Top-Heavy UI: Critical info and actions at top of page
 * 3. Minimal Horizontal Nesting: Avoid side-by-side grids on mobile
 * 4. Consistent Color Semantics: amber=currency, purple=vault, green=success
 * 5. Atomic Operations: Balance changes + audit logs must be atomic
 * 
 * COLOR PALETTE:
 * - Background: slate-950 → slate-900 gradients
 * - Cards: slate-900/50 with slate-700/50 borders
 * - Primary: green-600 → emerald-600 (buy, deposit, confirm)
 * - Vault: purple-600 → indigo-600 (vault operations)
 * - Currency: amber-400 (all point values)
 * - Success: green-400 (wins, positive changes)
 * - Warning: amber-300 (cooldowns, limits)
 * - Danger: red-500 (destructive actions)
 * 
 * GAME PAGE STRUCTURE (mandatory order):
 * 1. Back Button + Title (text-3xl sm:text-5xl font-black gradient)
 * 2. Balance Display (grid md:grid-cols-2)
 * 3. Active State Card (current pool/draw info)
 * 4. Primary CTA Button (w-full, gradient, py-3 sm:py-4)
 * 5. User's Tickets/Entries (if applicable)
 * 6. Game Mechanics (pickers, controls)
 * 7. Recent Results (collapsible on mobile)
 * 
 * RESPONSIVE GRIDS:
 * - Stats: grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
 * - Cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
 * - Number Pickers: grid-cols-7 (optimized for mobile)
 * 
 * SECURITY RULES:
 * - Always validate auth before operations
 * - Use service role only after auth check
 * - Implement idempotency for draws/payouts
 * - Check account age requirements
 * - Rate limit purchases per player/draw
 * 
 * ANIMATION:
 * - Page entry: initial={{ opacity: 0, y: 20 }}, delay: 0.1 * index
 * - Stagger cards with transition delay
 * 
 * BUTTON STATES:
 * - Loading: <Loader2 className="w-4 h-4 animate-spin" />
 * - Disabled: opacity-50 cursor-not-allowed
 * 
 * FORM INPUTS:
 * - bg-slate-800 border-slate-700 text-white
 * - Labels: text-slate-400 text-sm
 * - Helper text: text-slate-500 text-xs
 * 
 * STATUS INDICATORS:
 * - Success: bg-green-500/10 border-green-500/30 text-green-300
 * - Warning: bg-amber-500/10 border-amber-500/30 text-amber-300
 * - Info: bg-blue-500/10 border-blue-500/30 text-blue-300
 * 
 * EMPTY STATES:
 * - Icon: w-16 h-16 text-slate-600
 * - Title: text-xl font-bold text-white
 * - Description: text-slate-400
 * - CTA Button below
 * 
 * TESTING CHECKLIST:
 * ✓ Mobile: 375px width, no horizontal scroll
 * ✓ Touch: 44px+ targets, no precise tapping required
 * ✓ Auth: Unauthenticated users blocked
 * ✓ Balance: Insufficient funds rejected
 * ✓ Idempotency: Draws don't double-pay
 * ✓ Audit: All transactions logged
 */

export default function DesignConstitution() {
  return null;
}