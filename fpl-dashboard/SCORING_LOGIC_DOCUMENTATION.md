# FPL Dashboard — Scoring & Recommendation Engine: Internal Documentation

**Version:** April 2026  
**Codebase:** `fpl-dashboard/src/`  
**Audience:** Developers who need to understand, audit, or extend the recommendation engine.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Codebase Logic Map](#2-codebase-logic-map)
3. [Data Inputs from the FPL API](#3-data-inputs-from-the-fpl-api)
4. [Horizon and GW Range System](#4-horizon-and-gw-range-system)
5. [Fixture Difficulty and DGW/BGW Detection](#5-fixture-difficulty-and-dgwbgw-detection)
6. [Projected Points / Player Scoring](#6-projected-points--player-scoring)
7. [Starting XI Optimizer](#7-starting-xi-optimizer)
8. [Bench Ordering Logic](#8-bench-ordering-logic)
9. [True Best XI (Historical)](#9-true-best-xi-historical)
10. [Predicted Best XI (Optimizer Card)](#10-predicted-best-xi-optimizer-card)
11. [Transfer Recommendation Logic](#11-transfer-recommendation-logic)
12. [Sell Score](#12-sell-score)
13. [Buy Score](#13-buy-score)
14. [Transfer Pair Ranking](#14-transfer-pair-ranking)
15. [Captaincy Logic](#15-captaincy-logic)
16. [Gameweek Planner Logic](#16-gameweek-planner-logic)
17. [GW History and Analytics Panel](#17-gw-history-and-analytics-panel)
18. [Constraints and Rule Enforcement](#18-constraints-and-rule-enforcement)
19. [End-to-End Recommendation Flow](#19-end-to-end-recommendation-flow)
20. [Known Limitations](#20-known-limitations)
21. [How to Modify the System Safely](#21-how-to-modify-the-system-safely)

---

## 1. Overview

The FPL Dashboard recommendation engine is a **heuristic, rules-based scoring system** built on top of the public Fantasy Premier League API. It does not use machine learning or probabilistic modelling. All scoring is deterministic given the same API inputs.

The engine has three primary outputs:

| Output | Source Function | Purpose |
|---|---|---|
| Optimized starting XI | `optimizeXI()` in `lineup-optimizer.ts` | Recommended 11 from current 15-man squad |
| Transfer recommendations | `rankTransfers()` in `transfer-engine.ts` | Best OUT→IN player swaps |
| GW planner scores | `scorePlayer()` via `HorizonTable` | Per-player projected scores across horizon |

All three outputs share a single underlying scoring primitive: `scorePlayer()` in `projected-points.ts`.

---

## 2. Codebase Logic Map

```
src/
├── lib/
│   ├── engine/
│   │   ├── weights.ts              → DEFAULT_WEIGHTS: all scoring weights (9 factors)
│   │   ├── projected-points.ts     → scorePlayer(): core 0–10 scoring function
│   │   ├── fixture-difficulty.ts   → avgDifficulty(), teamFixtureCount(), getUpcomingFixtures()
│   │   ├── lineup-optimizer.ts     → optimizeXI(): formation brute-force optimizer
│   │   ├── best-xi.ts              → findBestXI(): formation-aware XI selector (any score type)
│   │   ├── sell-score.ts           → sellScore(): sell urgency 0–1
│   │   ├── buy-score.ts            → buyScore(): buy attractiveness 0–10
│   │   └── transfer-engine.ts      → rankTransfers(), computeSquadTeamCounts()
│   └── utils/
│       └── constants.ts            → VALID_FORMATIONS, POSITION_IDS, POSITION_NAMES
├── context/
│   └── FPLContext.tsx              → gwRange derivation, horizonGW state
├── hooks/
│   ├── useOptimizer.ts             → React hook wrapping optimizeXI()
│   ├── useTransfers.ts             → React hook wrapping rankTransfers()
│   └── usePlayerSummaries.ts       → Parallel SWR loader for player history
├── components/
│   ├── optimizer/OptimizedXI.tsx   → computeBestPredictedXI(): FPL-scale predictive XI
│   ├── planner/HorizonTable.tsx    → Per-GW score table using scorePlayer()
│   └── team/GWHistoryPanel.tsx     → calcPerGWPrediction(), computeTrueBestPossible()
└── types/
    ├── engine.ts                   → EngineWeights, ProjectedPoints, TransferPair, etc.
    └── fpl.ts                      → Player, Fixture, PicksResponse, PlayerSummary, etc.
```

**Data flow summary:**

```
FPL API → Next.js proxy routes → SWR hooks → FPLContext (gwRange, picks, bootstrap, fixtures)
                                                    ↓
                                            scorePlayer()  ←  DEFAULT_WEIGHTS
                                           /       |       \
                             optimizeXI()  rankTransfers()  HorizonTable
                                   ↓            ↓
                            OptimizedXI     TransferList
```

---

## 3. Data Inputs from the FPL API

All data is fetched from `https://fantasy.premierleague.com/api` via Next.js proxy routes defined in `src/app/api/fpl/`. All routes use `export const dynamic = "force-dynamic"` to prevent build-time static generation.

### From `/bootstrap-static` (cached 5 minutes via SWR `dedupingInterval: 300_000`)

Per-player fields used in scoring (type: `Player` in `src/types/fpl.ts`):

| Field | Type | Used For |
|---|---|---|
| `form` | `string` (parse to float) | Rolling 5-GW form signal |
| `points_per_game` | `string` (parse to float) | Season PPG signal |
| `ep_next` | `string` (parse to float) | FPL's own expected points next GW |
| `ict_index` | `string` (parse to float) | Influence/Creativity/Threat composite |
| `expected_goals_per_90` | `number` | Position-weighted goal upside |
| `expected_assists_per_90` | `number` | Assist upside |
| `expected_goals_conceded_per_90` | `number` | Defensive quality signal (GK/DEF) |
| `clean_sheets_per_90` | `number` | Historical clean sheet rate |
| `chance_of_playing_next_round` | `number \| null` | Availability probability |
| `status` | `"a"\|"u"\|"d"\|"i"\|"s"\|"n"` | Hard availability gating |
| `element_type` | `number` (1–4) | Position (GKP/DEF/MID/FWD) |
| `bonus` | `number` | Total bonus pts (BPS proxy) |
| `starts` | `number` | Games started (denominator for per-start rates) |
| `yellow_cards`, `red_cards` | `number` | Disciplinary history |
| `cost_change_event` | `number` | Price momentum this GW |
| `transfers_in_event`, `transfers_out_event` | `number` | Transfer crowd signal |
| `now_cost` | `number` | Current price in tenths (divide by 10 for £m) |
| `selling_price` | `number` (on `Pick`) | Actual sell price (accounts for 50% profit rule) |
| `penalties_order` | `number \| null` | Designated penalty taker |
| `in_dreamteam` | `boolean` | FPL Dream Team flag |
| `ict_index_rank` | `number` | Global ICT rank |
| `selected_by_percent` | `string` (parse to float) | Ownership percentage |

### From `/fixtures` (cached 5 minutes)

Per-fixture fields (`Fixture` type):

| Field | Used For |
|---|---|
| `event` | GW number (used to filter by `gwRange`) |
| `team_h`, `team_a` | Match teams |
| `team_h_difficulty`, `team_a_difficulty` | FDR values (1–5 scale) |
| `finished` | Filters upcoming vs completed fixtures |

### From `/entry/{teamId}/picks/{gw}`

`PicksResponse` containing `picks[]` (player selection, position 1–15) and `entry_history` (including `bank` in tenths).

### From `/entry/{teamId}/history`

`TeamHistory` with `current: EntryHistory[]` — per-GW points, bench points, rank, transfer costs, chips used.

### From `/element-summary/{id}`

`PlayerSummary` with `history: PlayerHistory[]` — per-fixture actual points. Used only in `GWHistoryPanel` for historical best-XI computation.

---

## 4. Horizon and GW Range System

**File:** `src/context/FPLContext.tsx`, `src/types/ui.ts`, `src/components/layout/GWSelector.tsx`

### HorizonGW type

```typescript
export type HorizonGW = 1 | 3 | 5;
```

The user can select one of three horizon windows: **1 GW**, **3 GWs**, or **5 GWs** via the `GWSelector` component or the planner's inline selector.

### gwRange derivation

```typescript
// In FPLContext.tsx
const gwRange = useMemo(() => {
  const range: number[] = [];
  for (let i = 0; i < horizonGW; i++) {
    range.push(effectiveGW + i);
  }
  return range;
}, [effectiveGW, horizonGW]);
```

For `horizonGW = 3` and `currentGW = 33`, this produces `gwRange = [33, 34, 35]`.

`currentGW` is derived from `bootstrap.events` — the event with `is_current = true`, or `is_next.id - 1` as fallback.

### How gwRange is consumed

`gwRange` is passed as-is to every engine function. There is **no recency weighting within the range** — GW 33 and GW 35 are treated identically. The fixture difficulty is averaged across all GWs in the range.

---

## 5. Fixture Difficulty and DGW/BGW Detection

**File:** `src/lib/engine/fixture-difficulty.ts`

### `avgDifficulty(teamId, fixtures, gwRange): number`

Computes the **average FDR** (Fixture Difficulty Rating) for a team over the selected GW range, using only upcoming (non-finished) fixtures.

```
avgFDR = sum(difficulty of each relevant fixture) / count(relevant fixtures)
Fallback = 3.0 (neutral) if no upcoming fixtures found
```

FDR values are 1–5 where 1 = very easy, 5 = very hard. The result is used in `scorePlayer()` as:

```
fixtureEase = 1 - avgFDR / 5.0
```

So FDR=1 → fixtureEase=0.8, FDR=3 → fixtureEase=0.4, FDR=5 → fixtureEase=0.0.

> **Note:** `avgDifficulty` filters by `!f.finished`. This means if all fixtures in the range are complete (e.g., mid-GW), it returns 3.0 (neutral). This can cause the fixture factor to flatten mid-GW.

### `teamFixtureCount(teamId, fixtures, gwRange): number`

Returns the count of upcoming fixtures for a team within `gwRange`. Used to detect:

- **BGW (Blank Gameweek):** `count === 0` — team has no fixture
- **DGW (Double Gameweek):** `count > gwRange.length` — team plays more than once per GW on average
- **Normal:** `count === gwRange.length`

### DGW/BGW multiplier in `scorePlayer()`

```typescript
const fixtureScale =
  fixtureCount > expectedGames
    ? 1 + (fixtureCount - expectedGames) * 0.80 / expectedGames   // DGW boost
    : fixtureCount / expectedGames;                                 // BGW reduction or normal
```

For a single-GW horizon:
- BGW (0 fixtures): `fixtureScale = 0` → score = 0 (early return)
- Normal (1 fixture): `fixtureScale = 1.0`
- DGW (2 fixtures): `fixtureScale = 1.80`

The 80% factor (not 100%) represents assumed rotation risk in double gameweeks.

`fixtureScale` is applied to all **per-game contributions** (form, PPG, ep_next, ICT, minutes, positionGoal, cleanSheet, defContribution, disciplinary). It is **not** applied to `fixtureEase` (fixture quality, not quantity).

### `getUpcomingFixtures(teamId, fixtures, gwRange): UpcomingFixture[]`

Returns an array of `{ event, opponentId, isHome, difficulty }` for display purposes. Does **not** filter by `!f.finished` — used for display only.

---

## 6. Projected Points / Player Scoring

**File:** `src/lib/engine/projected-points.ts`  
**Weights:** `src/lib/engine/weights.ts`

### Purpose

`scorePlayer(player, fixtures, gwRange, weights?)` converts a player's FPL API data into a single **0–10 score** representing their expected performance over the selected GW range. This is the core primitive consumed by all recommendation modules.

### Weights (`DEFAULT_WEIGHTS` in `weights.ts`)

```typescript
export const DEFAULT_WEIGHTS: EngineWeights = {
  form:                0.20,
  ppg:                 0.17,
  epNext:              0.18,
  ictIndex:            0.08,
  fixtureEase:         0.12,
  minutesProbability:  0.07,
  positionGoalBonus:   0.05,
  cleanSheetProb:      0.10,
  defContribution:     0.03,
};
// Sum = 1.00
```

### Normalised Inputs

Each raw FPL field is normalised to [0, 1] before weighting:

| Factor | Normalisation | Cap |
|---|---|---|
| `form` | `parseFloat(form) / 12.0` | 1.0 |
| `points_per_game` | `parseFloat(ppg) / 15.0` | 1.0 |
| `ep_next` | `parseFloat(ep_next) / 15.0` | 1.0 |
| `ict_index` | `parseFloat(ict_index) / 100.0` | 1.0 |
| Fixture ease | `1 - avgFDR / 5.0` | Implicit [0, 0.8] |
| Minutes probability | `chance_of_playing / 100` or 0.95 | 1.0 |

Normalisation denominators (12, 15, 100) are **hardcoded heuristic caps**, not derived from the data. They represent "very high" values for each metric.

### Position-Specific Factors (Official FPL Scoring)

#### Position Goal Bonus (`positionGoalBonus`)

Based on official FPL scoring: GK goal = 10 pts, DEF = 6 pts, MID = 5 pts, FWD = 4 pts.

```typescript
const GOAL_PTS: Record<number, number> = { 1: 10, 2: 6, 3: 5, 4: 4 };
const goalPtsFactor = (GOAL_PTS[player.element_type] ?? 4) / 4;  // relative to FWD baseline
const xgAdj = player.expected_goals_per_90 * goalPtsFactor;
const xaAdj = player.expected_assists_per_90;
const normPositionGoal = Math.min(1.0, (xgAdj + xaAdj) / 1.2);
```

A DEF with the same xG/90 as a FWD gets `1.5×` the goal bonus. A GK gets `2.5×`. The denominator 1.2 is a heuristic cap.

#### Clean Sheet Probability (`cleanSheetProb`)

Based on official FPL scoring: GK/DEF clean sheet = 4 pts, MID = 1 pt, FWD = 0 pts.

```typescript
const CS_PTS: Record<number, number> = { 1: 4, 2: 4, 3: 1, 4: 0 };
const csRateBase = Math.min(player.clean_sheets_per_90, 0.8);
const csRateAdj  = csRateBase * (0.4 + fixtureEase * 0.8);  // fixture-adjusted
const normCS = Math.min(1.0, (csRateAdj * csValue) / 4.0);  // normalised by max CS pts
```

For FWD (`CS_PTS = 0`), `normCS = 0` — the CS weight contributes nothing.

The fixture adjustment `(0.4 + fixtureEase * 0.8)` ranges from 0.4 (hardest fixture, FDR=5) to 1.2 (easiest, FDR=1). This is an approximation — it does not model team defensive strength directly.

#### Defensive Contribution (`defContribution`)

Proxies the official FPL +2 pt bonus for 10+ CBI (clearances, blocks, interceptions) for defenders.

```typescript
const bonusPerStart = player.starts > 0 ? player.bonus / player.starts : 0;
const normDefContrib = player.element_type <= 2
  ? Math.min(1.0, bonusPerStart / 1.0)   // GK/DEF: 1 bonus/start = elite
  : Math.min(1.0, bonusPerStart / 1.8);  // MID/FWD: higher bar
```

> **Approximation note:** `player.bonus` is the total FPL bonus points received, not the raw BPS score. Bonus points accumulate from multiple sources (goals, assists, defensive actions). For outfield attackers, this proxy over-rewards goal-scorers as "high defensive contributors". This is a known imperfection.

### Disciplinary Penalty (Direct Deduction)

Not a weighted factor — applied as a direct deduction to the raw score.

```typescript
const yellowRate = player.starts > 0 ? player.yellow_cards / player.starts : 0;
const redRate    = player.starts > 0 ? player.red_cards    / player.starts : 0;
const disciplinaryPenalty = Math.min(0.5, yellowRate * 1.0 + redRate * 3.0);
// Applied: -disciplinaryPenalty * 0.5  (penalty can reduce raw score by up to 0.25)
```

The `* 0.5` scaling means even a player with a red card every game has their raw score reduced by at most 0.25 (out of ~1.0), so the maximum disciplinary impact is ~2.5 points on the 0–10 scale.

### Raw Score Formula

```
rawScore = (form × 0.20 + ppg × 0.17 + ep × 0.18 + ict × 0.08 + fixture × 0.12
           + minutes × 0.07 + posGoal × 0.05 + cs × 0.10 + def × 0.03
           - disciplinary × 0.5) × fixtureScale

score = rawScore × 10
```

Per-game factors (all except `fixtureEase`) are multiplied by `fixtureScale` before weighting.

### Availability Multipliers (Applied After Weighted Sum)

```typescript
if (player.status === "u") score = 0;               // unavailable: hard zero
else if (player.status === "i") score *= 0.1;        // injured: 90% penalty
else if (player.status === "d") score *= minuteProb; // doubtful: scales by chance
```

Status `"a"` (available), `"s"` (suspended), `"n"` (not in squad) do not trigger these multipliers. Note that `"s"` (suspended) is not explicitly zeroed here — it is handled only in `sellScore()` reasoning text.

### Final Clamp

```typescript
score = Math.max(0, Math.min(10, score));
```

---

## 7. Starting XI Optimizer

**File:** `src/lib/engine/lineup-optimizer.ts`  
**Hook:** `src/hooks/useOptimizer.ts`

### Purpose

`optimizeXI(picks, allPlayers, fixtures, gwRange, weights?)` finds the best 11 players to start from the current 15-man squad using a **formation brute-force search** over all 8 valid FPL formations.

### Valid Formations

Defined in `src/lib/utils/constants.ts` as `VALID_FORMATIONS`:

```typescript
export const VALID_FORMATIONS: FormationDef[] = [
  { name: "3-4-3", def: 3, mid: 4, fwd: 3 },
  { name: "3-5-2", def: 3, mid: 5, fwd: 2 },
  { name: "4-4-2", def: 4, mid: 4, fwd: 2 },
  { name: "4-3-3", def: 4, mid: 3, fwd: 3 },
  { name: "4-5-1", def: 4, mid: 5, fwd: 1 },
  { name: "5-4-1", def: 5, mid: 4, fwd: 1 },
  { name: "5-3-2", def: 5, mid: 3, fwd: 2 },
  { name: "5-2-3", def: 5, mid: 2, fwd: 3 },
];
```

All 8 formations include exactly 1 GK, totalling 11 outfield slots.

### Algorithm

1. Score all 15 squad players using `scorePlayer()`.
2. Group players by `element_type` (POSITION_IDS: GKP=1, DEF=2, MID=3, FWD=4).
3. Sort each group by score descending.
4. For each formation in `VALID_FORMATIONS`:
   - Take top 1 GK, top `def` DEFs, top `mid` MIDs, top `fwd` FWDs.
   - Skip formation if insufficient players in any position.
   - Sum the 11 projected scores.
5. Select the formation with the **highest summed score**.

This is a **greedy heuristic**, not a combinatorial optimum. Within each position group, the top N players by individual score are always selected — the algorithm does not try swapping, say, the 4th defender with an additional midfielder to find a better combination.

### Outputs (`OptimizedXI` type)

```typescript
{
  formation: Formation;          // e.g. "4-3-3"
  starters: number[];            // player IDs
  bench: number[];               // player IDs, sub-priority order
  captain: number;               // player ID
  viceCaptain: number;           // player ID
  totalProjectedPoints: number;  // sum of 11 scores (0–10 scale)
  currentFormation: Formation | null;
  projectedGainVsCurrent: number; // vs user's current starting XI
}
```

### Projected Gain vs Current

```typescript
const currentTotal = scoredPicks
  .filter(sp => currentStarterIds.has(sp.pick.element))
  .reduce((s, sp) => s + sp.score, 0);

projectedGainVsCurrent = bestTotal - currentTotal;
```

Both `bestTotal` and `currentTotal` are in the 0–10 scale, not FPL points. The displayed "+X.X pts gain" figure is therefore a **dimensionless score unit**, not actual FPL points.

### Formation Detection

```typescript
function detectCurrentFormation(picks, playerMap): Formation | null
```

Counts DEF/MID/FWD among position 1–11 picks and returns the `DEF-MID-FWD` string. Returns `null` if the result doesn't match any `VALID_FORMATIONS` entry.

---

## 8. Bench Ordering Logic

**File:** `src/lib/engine/lineup-optimizer.ts`

The bench order (sub-priority) is determined after the optimal formation is selected:

```typescript
const bench = scoredPicks
  .filter(sp => !starterIds.has(sp.pick.element))
  .sort((a, b) => b.score - a.score);
```

The 4 non-starting players are sorted by `scorePlayer()` score descending. There is **no special handling** for:

- GK bench priority (FPL rules require a GK on bench; the code relies on squad legality pre-existing)
- Auto-sub compatibility (bench player must be able to play the position of the outgoing starter)
- Budget or formation validity of the bench order

The bench sub-priority shown in the UI is therefore the engine's recommendation for which bench player is most valuable, not a formation-legal auto-sub order.

---

## 9. True Best XI (Historical)

**File:** `src/lib/engine/best-xi.ts`  
**Used by:** `src/components/team/GWHistoryPanel.tsx`

### Purpose

`findBestXI(players: PlayerScore[])` determines the **formation-optimal XI** from any set of 15 players when scores are in FPL points (not the normalised 0–10 scale). It is used to compute the true historical "best possible" score per GW.

### Algorithm

Identical structure to `optimizeXI()`, but:
- Accepts `PlayerScore[]` (`{ id, elementType, score }`) directly, not a squad + API data
- Tries all 8 `VALID_FORMATIONS`
- Selects the XI with highest `base + captainBonus` where `captainBonus = max(starter.score)`

```typescript
const totalWithCaptain = base + captain.score; // captain's score added once more (2× total)
```

### Return Type (`BestXIResult`)

```typescript
{
  starterIds: number[];
  captainId: number;
  totalWithCaptain: number; // actual FPL pts scale
  formation: string;
}
```

### Historical Best Possible (in `GWHistoryPanel`)

```typescript
function computeTrueBestPossible(gwNum, playerMap, summaries): number {
  const scores = Array.from(playerMap.entries()).map(([id, player]) => {
    const gwPts = summary?.history
      .filter(h => h.round === gwNum)
      .reduce((s, h) => s + h.total_points, 0) ?? 0;
    return { id, elementType: player.element_type, score: gwPts };
  });
  return findBestXI(scores).totalWithCaptain;
}
```

Per-GW points are **summed across all history entries for the same round** — this correctly handles DGWs where a player has two entries for the same `round` value.

> **Approximation note:** This uses the **current** 15-man squad's player summaries for all historical GWs. If players were transferred in/out during the season, historical GWs reflect the current squad, not the actual squad at that time. Players transferred out will have no history for recent GWs; players transferred in may lack early-season history.

---

## 10. Predicted Best XI (Optimizer Card)

**File:** `src/components/optimizer/OptimizedXI.tsx`

### Purpose

`computeBestPredictedXI(allPicks, playerMap, fixtures, gwRange)` computes the **expected average FPL points per GW** for the optimal predicted XI, using FPL-scale predicted points (not the 0–10 engine score).

This is a **separate scoring system** from `scorePlayer()`, designed to produce a number the user can compare against actual FPL scores.

### Formula Per Player

```typescript
const epNext = parseFloat(p.ep_next) || 0;
const formPerGW = parseFloat(p.form) || 0;
const avgFDR = fixtures.length > 0 ? avgDifficulty(p.team, fixtures, gwRange) : 3.0;
const fdrFactor = Math.min(2.0, 3.0 / Math.max(1, avgFDR));  // easy fixtures boost

const totalPts = epNext + formPerGW * fdrFactor * Math.max(0, gwCount - 1);

score = (totalPts / gwCount) * avail * fixtureScale;
```

For `gwCount = 1`: predicted score = `epNext * avail * fixtureScale`  
For `gwCount = 3`: predicted score = `(epNext + form × fdrFactor × 2) / 3 × avail × fixtureScale`

**Availability factor:**
- `status === "u"`: `avail = 0`
- `status === "i"`: `avail = 0.1`
- `status === "d"`: `avail = chance_of_playing_next_round / 100` (fallback: 0.5)
- Otherwise: `avail = 1.0`

The FDR factor `3.0 / avgFDR` means:
- FDR=1 (very easy): `fdrFactor = 3.0` (but capped at 2.0)
- FDR=3 (neutral): `fdrFactor = 1.0`
- FDR=5 (very hard): `fdrFactor = 0.6`

After computing per-player scores, `findBestXI()` selects the optimal XI and captain. The `totalWithCaptain` from `findBestXI()` is displayed as the predicted points.

### Why This Is Separate from `scorePlayer()`

`scorePlayer()` produces a normalised 0–10 score for **ranking purposes**. `computeBestPredictedXI()` produces a **FPL-scale estimate** directly comparable to actual game scores. The two systems use different formulas for this reason.

> **Inconsistency note:** The player card display in the Optimizer tab lists a "Proj" score using `scorePlayer()` (0–10 scale), while the prediction card at the top uses `computeBestPredictedXI()` (FPL-scale). These are different numbers and cannot be directly compared.

---

## 11. Transfer Recommendation Logic

**File:** `src/lib/engine/transfer-engine.ts`  
**Hook:** `src/hooks/useTransfers.ts`

### Entry Point

```typescript
rankTransfers(picks, squadPlayerIds, allPlayers, fixtures, gwRange, context, weights?)
```

The hook `useTransfers` calls this inside a `useMemo` with `dedupingInterval: 300_000`. Context includes:
- `bank`: available budget (in tenths, e.g. `8` = £0.8m)
- `squadTeamCounts`: `Record<teamId, count>` for 3-per-club enforcement
- `teamLimit: 3`

### Algorithm (5 Steps)

**Step 1 — Score and rank sell candidates**

All 15 squad players are passed through `sellScore()`. The top 5 by sell urgency are selected as sell candidates.

**Step 2 — For each sell candidate, find buy candidates**

For each sell candidate, filter `allPlayers` to same-position players who:
- Are not already in the squad (`!squadPlayerIds.has(p.id)`)
- Are affordable (`p.now_cost <= candidate.salePrice + context.bank`)
- Don't violate the 3-per-club rule (accounting for the player being sold)
- Have not already been recommended as a buy in an earlier pair

Pass each eligible player through `buyScore()`. Take the top 5 by buy score.

**Step 3 — Pair candidates**

For each sell-buy pair, compute:

```typescript
const netGain = buy.projectedScore - candidate.projectedScore;
```

> **Note:** The `netGain` line in the code reads:
> ```typescript
> const netGain = buy.buyScore - buy.projectedScore * 0 + buy.projectedScore - candidate.projectedScore;
> ```
> The `buy.buyScore * 0` term is vestigial (multiplied by zero, contributes nothing). Effective formula: `netGain = buy.projectedScore - sell.projectedScore` — purely a projected score differential on the 0–10 scale.

**Step 4 — Deduplicate**

`usedBuyIds` ensures the same player cannot appear as the recommended "IN" in two different pairs.

**Step 5 — Sort and return top 10**

Pairs are sorted by `netGain` descending and assigned ranks 1–10.

---

## 12. Sell Score

**File:** `src/lib/engine/sell-score.ts`

`sellScore(pick, player, fixtures, gwRange, weights?)` returns a `SellCandidate` with:
- `sellScore`: 0–1 urgency (higher = sell sooner)
- `salePrice`: from `pick.selling_price` (actual FPL sell price) or `player.now_cost`
- `projectedScore`: from `scorePlayer()` (0–10)
- `reasons`: human-readable sell signals

### Score Formula

```
sellScore = lowProjContrib + injuryContrib + priceFallContrib + fdrContrib + disciplineContrib + dgwContrib
clamped to [0, 1]
```

| Component | Formula | Max |
|---|---|---|
| `lowProjContrib` | `(1 - projScore / 10) × 0.45` | 0.45 |
| `injuryContrib` | `0.30` if `u/i`, `0.25` if `s`, `0.15` if `d` | 0.30 |
| `priceFallContrib` | `0.08` if `cost_change_event < 0` | 0.08 |
| `fdrContrib` | GK/DEF: `max(0, (fdr-3.5)/4) × 0.05`; others: `max(0, (fdr-3)/4) × 0.10` | 0.05 / 0.10 |
| `disciplineContrib` | `min(0.08, yellowRate × 0.1 + redRate × 0.2)` | 0.08 |
| `dgwContrib` | `+0.20` if BGW (0 fixtures), `-0.10` if DGW | ±0.20 |

### Position-Aware Fixture Threshold

Defenders and goalkeepers have a higher fixture difficulty threshold before the `fdrContrib` activates:
- GK/DEF: only flags if `fdr >= 3.5` AND `clean_sheets_per_90 < 0.2`
- Outfield: flags if `fdr >= 3.5`

This prevents recommending selling a reliable clean-sheet defender purely based on a tough fixture.

---

## 13. Buy Score

**File:** `src/lib/engine/buy-score.ts`

`buyScore(player, fixtures, gwRange, weights?)` returns a `BuyCandidate` with:
- `buyScore`: 0–10 attractiveness
- `projectedScore`: from `scorePlayer()` (0–10)
- `reasons`: human-readable buy signals

### Score Formula

```typescript
const vmRatio = projScore / priceInMillions;  // value per £m
const rawBuy = projScore × 0.7 + min(vmRatio × 3, 3) × 0.3;
finalScore = min(10, rawBuy);
```

- 70% weight on raw projected score
- 30% weight on value-for-money (score per £m, capped at 3 units × 0.3 = max 0.9 contribution)

### Reason Flags (informational, do not affect score)

DGW/BGW detection, form thresholds, FDR thresholds, ep_next thresholds, ICT rank, transfer volume, ownership differential, clean sheet record, saves rate, defensive contribution, and disciplinary warnings are all surfaced as text reasons.

---

## 14. Transfer Pair Ranking

**File:** `src/lib/engine/transfer-engine.ts`

### Ranking Key

```typescript
pairs.sort((a, b) => b.netGain - a.netGain);
return pairs.slice(0, 10).map((p, i) => ({ ...p, rank: i + 1 }));
```

`netGain` is the projected score differential between the buy and sell player (both on 0–10 scale). The `rank` field is purely ordinal (1 = best recommendation).

### Displayed Data in `TransferRow`

- `pair.out.salePrice` / `pair.in.cost`: prices (in tenths, formatted via `formatPrice()`)
- `pair.priceDiff`: `inPlayer.now_cost - candidate.salePrice` (positive = costs more)
- `pair.out.projectedScore` / `pair.in.projectedScore`: 0–10 engine scores (not FPL points)
- `pair.reasons`: combined buy + sell reason strings (up to 2 buy reasons + 1 sell reason)
- Upcoming fixtures for the incoming player: shown via `getUpcomingFixtures(inPlayer.team, fixtures, gwRange.slice(0, 3))`

---

## 15. Captaincy Logic

The captain selection in `OptimizedXI` is derived from `computeBestPredictedXI()`:

```typescript
const result = findBestXI(playerScores);  // playerScores are FPL-scale predicted pts
captainId = result.captainId;             // highest predicted scorer in the optimal XI
```

`findBestXI()` sets captain as:
```typescript
const captain = starters.reduce((m, p) => (p.score > m.score ? p : m));
```

The captain is the **highest predicted-score player in the optimal starting XI**. There is no separate captaincy model weighting reliability, ceiling, or ownership differential.

### Vice Captain

```typescript
const sortedStarters = playerScores
  .filter(ps => starterSet.has(ps.id))
  .sort((a, b) => b.score - a.score);
const vcId = sortedStarters[1]?.id ?? sortedStarters[0]?.id ?? -1;
```

VC is the **second-highest predicted scorer** among the optimal starters. No additional logic applies.

### Separation from Formation Optimizer

The `useOptimizer()` hook returns `captain` and `viceCaptain` from `optimizeXI()` (0–10 scale). The `OptimizedXI` component **overrides** these with `predicted.captainId` / `predicted.vcId` (FPL-scale) for display on both the prediction card and player cards. This ensures consistency between the header and pitch view.

---

## 16. Gameweek Planner Logic

**Files:** `src/components/planner/PlannerView.tsx`, `src/components/planner/HorizonTable.tsx`

### Purpose

The Planner tab shows a table of all 15 squad players with their `scorePlayer()` output per GW within the selected horizon, plus the upcoming fixture for each GW.

### Per-Player, Per-GW Score

```typescript
const gwScores = gwRange.map((gw) => {
  const singleGW = [gw];
  return {
    gw,
    score: scorePlayer(player, fixtures, singleGW).score,
    fixture: getUpcomingFixtures(player.team, fixtures, singleGW)[0],
  };
});
const totalScore = gwScores.reduce((s, g) => s + g.score, 0);
```

Each individual GW is scored independently by passing `[gw]` (single-element array) to `scorePlayer()`. This means each GW's score fully applies DGW/BGW detection for that specific gameweek.

The `totalScore` is the sum across all GWs in the horizon — it is **not averaged**. For a 3-GW horizon, scores in the 0–30 range are possible.

### Sorting

```
Starters (position ≤ 11) first, then bench.
Within each group: sort by totalScore descending.
```

### Colour Coding

```typescript
const norm = score / (maxScore / gwRange.length);  // normalise by per-GW max
if (norm >= 0.75) → green   // top 25% of performers
if (norm >= 0.50) → cyan    // above median
if (norm >= 0.25) → white   // below median
otherwise         → grey    // bottom 25%
```

Colour thresholds are relative to the squad's best performer for that GW, not absolute.

### Horizon Options

Available values: `1`, `3`, `5` (type `HorizonGW`). There is no option for 2 or 4 GWs. The planner uses the same `gwRange` as all other modules.

---

## 17. GW History and Analytics Panel

**File:** `src/components/team/GWHistoryPanel.tsx`  
**Hook:** `src/hooks/useTeamHistory.ts`, `src/hooks/usePlayerSummaries.ts`

### Data Sources

- `useTeamHistory(teamId)`: fetches `TeamHistory` from `/entry/{teamId}/history`
- `usePlayerSummaries(squadIds)`: batch-fetches all 15 player summaries in parallel (SWR key `summaries:{sorted ids}`, `dedupingInterval: 3_600_000`)

### Columns

| Column | Source | Formula |
|---|---|---|
| Actual | `gw.points` | Official FPL GW score |
| Best XI | `computeTrueBestPossible()` | `findBestXI()` on current squad's actual GW pts |
| Missed | `bestPossible - gw.points` | Points left uncaptured |
| Hit | `gw.event_transfers_cost` | Transfer penalty in pts |
| GW Rank | `gw.rank` | Global rank for that GW |

### Current GW Prediction (`calcPerGWPrediction`)

```typescript
total += ep * avail * fixtureScale * (id === captainId ? 2 : 1);
```

Uses `ep_next` (not `form`) as the sole predicted pts input. Applies DGW/BGW scaling via `teamFixtureCount()`. Captain gets 2× multiplier.

> **Note:** This prediction uses `optimizer.starters` and `optimizer.captain` from `useOptimizer()` (0–10 scale optimizer) — not `computeBestPredictedXI()`. This is a minor inconsistency with the optimizer card's captain, which may differ.

### OLS Regression (Analytics Chart)

The analytics chart computes an Ordinary Least Squares trend line for both actual points and best-possible points:

```typescript
function ols(pts: { x: number; y: number }[]): { slope, intercept } {
  const ssXY = Σ (x - xBar)(y - yBar);
  const ssXX = Σ (x - xBar)²;
  slope = ssXY / ssXX;
  intercept = yBar - slope × xBar;
}
```

Two OLS lines are computed: one for actual pts, one for best-possible pts. These are display-only and do not feed into any recommendation.

---

## 18. Constraints and Rule Enforcement

### Formation Validity

Enforced in `optimizeXI()` and `findBestXI()` by checking against `VALID_FORMATIONS`. Any formation requiring more players than available in a position is skipped.

FPL rules enforced:
- Always exactly 1 GK in the starting XI ✓
- DEF: 3–5 ✓
- MID: 2–5 ✓
- FWD: 1–3 ✓
- Total starters = 11 ✓

### Squad Composition (15 players)

Not validated by the engine — assumed to be correct from the FPL API response. The `useOptimizer` hook returns `null` if `picks.length < 15`.

### Budget Constraint

Enforced in `rankTransfers()`:

```typescript
const budget = candidate.salePrice + context.bank;
if (p.now_cost > budget) return false;  // can't afford
```

`salePrice` is `pick.selling_price ?? player.now_cost`. `pick.selling_price` is the actual FPL sell price from the API, which accounts for the 50% profit-split rule.

### 3 Players Per Club

```typescript
const currentCount = context.squadTeamCounts[p.team] ?? 0;
const adjustedCount = p.team === outPlayer.team ? currentCount - 1 : currentCount;
if (adjustedCount >= context.teamLimit) return false;
```

The squad count for the sold player's club is decremented before checking, correctly handling the case where you're selling from a 3-player club.

### Positional Constraint in Transfers

```typescript
if (p.element_type !== outPlayer.element_type) return false;
```

Buy candidates must match the position of the player being sold (like-for-like only).

### Bench Legality

Not enforced. The engine does not verify that the 4 bench players constitute a valid FPL bench (must include 1 GK).

### Free Transfer Count

Currently hardcoded to 1 in `TransferList.tsx`:

```typescript
const freeTransfers = 1; // default, could be derived from history in future
```

The 4-point hit for additional transfers is **not factored into `netGain`**. A transfer recommendation showing +1.5 pts gain should therefore be ignored if it consumes a second free transfer (actual gain = 1.5 − 4 = −2.5).

---

## 19. End-to-End Recommendation Flow

### Transfer Recommendation

```
User loads dashboard
  → FPLContext loads: bootstrap, fixtures, picks, currentGW
  → gwRange = [currentGW ... currentGW + horizonGW - 1]
  
useTransfers(picks, bootstrap.elements, fixtures, gwRange)
  → computeSquadTeamCounts(picks, playerMap)
  → rankTransfers(picks, squadIds, allPlayers, fixtures, gwRange, { bank, teamCounts, limit:3 })
      → For each of 15 picks: sellScore(pick, player, fixtures, gwRange)
          → scorePlayer(player, fixtures, gwRange)  [core]
          → DGW/BGW detection, fixture threshold, disciplinary flags
      → Sort sell candidates, take top 5
      → For each sell candidate:
          → Filter allPlayers by position, budget, team limit, not-in-squad
          → For each candidate: buyScore(player, fixtures, gwRange)
              → scorePlayer(player, fixtures, gwRange)  [core]
              → DGW/BGW, clean sheet, position goal flags
          → Take top 5 buy candidates
          → Pair: netGain = buy.projectedScore - sell.projectedScore
      → Sort all pairs by netGain, take top 10, assign ranks
  → TransferList renders TransferRow per pair
```

### Optimizer Recommendation

```
useOptimizer(picks, bootstrap.elements, fixtures, gwRange)
  → optimizeXI(picks, allPlayers, fixtures, gwRange)
      → Score all 15 via scorePlayer()
      → Try all 8 VALID_FORMATIONS
      → Select formation with highest sum of 11 scores
      → Captain = highest scorer among starters (0-10 scale)
      → VC = second-highest scorer among starters (0-10 scale)
      → bench = remaining 4, sorted by score desc

OptimizedXI component:
  → computeBestPredictedXI(picks.picks, playerMap, fixtures, gwRange)
      → For each pick: predicted FPL pts = (epNext + form×fdrFactor×(gwCount-1)) / gwCount × avail × fixtureScale
      → findBestXI(playerScores) → optimal XI + captainId (FPL-scale)
      → VC = 2nd highest scorer among optimal starters
  → Prediction card shows computeBestPredictedXI total (FPL-scale)
  → Pitch/list shows optimized.starters formation (0-10 scale)
  → C/V badges use predicted.captainId / predicted.vcId (FPL-scale)
```

---

## 20. Known Limitations

### Scoring Model

1. **No probabilistic modelling.** Scores are deterministic point estimates with no confidence intervals. A player with `ep_next = 6` and a player with `ep_next = 5.9` score almost identically, but one may have much higher ceiling.

2. **`ep_next` is FPL's black-box estimate.** The engine uses it as-is without independent verification. FPL's `ep_next` has known biases (e.g., lagging on hot streaks, not updating for late injuries).

3. **`form` is a 5-GW rolling average divided by 12.** The denominator 12 is hardcoded and not derived from the data. A player who scored 12 pts once gets `normForm = 1.0`, same as a player averaging 12 pts across 5 games.

4. **No opponent-specific modelling.** `avgDifficulty()` uses FDR (1–5 scale), which is coarse. FDR=3 could represent a mid-table team at home or away — the engine treats them identically.

5. **Home/away not separately modelled.** `avgDifficulty()` uses `team_h_difficulty` or `team_a_difficulty` which are different values — so H/A is implicitly in the FDR. However, the engine does not apply any separate home/away bonus (typically ~0.3 goals advantage).

6. **Defensive contribution proxy is imperfect.** `bonus / starts` rewards all sources of bonus points equally, not just defensive actions. For FWDs, high bonus per start reflects goals, not CBI activity.

7. **No press conference / team news integration.** Injury flags rely on `player.status`, which may lag real-world news by hours.

8. **No bookmaker odds.** Goal probability for DGWs, CS probability, and captain upside are not cross-referenced with match odds.

9. **No xG against opponent.** Clean sheet probability is estimated from `clean_sheets_per_90` × fixture ease, not from the opponent's offensive xG.

10. **DGW rotation risk fixed at 20%.** The `0.80` multiplier per extra fixture is a hardcoded assumption, not player- or manager-specific.

### Transfer Logic

11. **`netGain` is in 0–10 score units, not FPL points.** Displayed as "pts gain" in the UI, which is misleading. A `+1.5 gain` does not mean 1.5 extra expected FPL points.

12. **Transfer cost (4 pts per extra transfer) is not subtracted from `netGain`.** The UI shows `freeTransfers = 1` hardcoded and does not compute breakeven.

13. **Sell candidates capped at 5.** If the 6th-best sell candidate paired with an excellent buy produces a better transfer than any of the top 5 pairs, it will not be surfaced.

14. **No multi-transfer optimisation.** The engine recommends individual OUT→IN pairs. It does not consider two transfers simultaneously (e.g., selling two players to buy two premium assets).

15. **Price rise / price fall momentum is weakly modelled.** Only `cost_change_event < 0` triggers a sell reason. Future price rise expectation is not modelled.

### Historical Analysis

16. **Historical Best XI uses current squad.** Past GW "best possible" scores reflect the current 15-man squad, not the actual squad at that time. Transferred-out players are excluded; recently transferred-in players may lack full season history.

17. **OLS regression is display-only.** The trend lines in the analytics chart have no bearing on any recommendation.

### Architecture

18. **Two parallel scoring systems.** `scorePlayer()` (0–10 normalised) and `computeBestPredictedXI()` (FPL-scale) coexist and produce different captaincy results. This can cause confusion when comparing numbers.

19. **No learning or feedback loop.** The model does not observe whether past recommendations led to better scores. Weights are static.

---

## 21. How to Modify the System Safely

### Changing Scoring Weights

**File:** `src/lib/engine/weights.ts`

Edit `DEFAULT_WEIGHTS`. All 9 values **must sum to 1.0**. The `disciplinaryPenalty` is a direct deduction (not a weight) — do not add it here.

```typescript
export const DEFAULT_WEIGHTS: EngineWeights = {
  form:                0.20,   // ← increase to prioritise recent form
  ppg:                 0.17,
  epNext:              0.18,   // ← most directly linked to expected FPL pts
  ictIndex:            0.08,
  fixtureEase:         0.12,   // ← increase for fixture-chasing strategies
  minutesProbability:  0.07,
  positionGoalBonus:   0.05,
  cleanSheetProb:      0.10,   // ← increase to prioritise defensive assets
  defContribution:     0.03,
};
```

To add a new weight factor, you must also:
1. Add the key to `EngineWeights` in `src/types/engine.ts`
2. Add the computed normalised input in `scorePlayer()` in `projected-points.ts`
3. Add the contribution to `breakdown` in `ProjectedPoints` type
4. Reduce other weights to maintain sum = 1.0

### Editing the Optimizer Formation Logic

**File:** `src/lib/engine/lineup-optimizer.ts`

To change which formations are considered, edit `VALID_FORMATIONS` in `src/lib/utils/constants.ts`. New entries must conform to `FormationDef` (def + mid + fwd = 10).

To change from greedy selection to combinatorial search (e.g., try all permutations within a position), modify the inner loop of `optimizeXI()`. Be aware this has O(n!) complexity if misapplied.

### Editing the Transfer Recommendation Logic

**File:** `src/lib/engine/transfer-engine.ts`

- To change number of sell candidates considered: edit `.slice(0, 5)` on line selecting `sellCandidates`
- To change number of buy candidates per sell: edit `.slice(0, 5)` on `buyCandidates`
- To change the number of pairs returned: edit `.slice(0, 10)`
- To factor in transfer cost: add `-4 * max(0, pairIndex - freeTransfers)` to `netGain`
- To enable multi-transfer planning: would require significant restructuring — consider a separate `planTransfers()` function

### Editing Sell / Buy Score Reasoning

**Files:** `src/lib/engine/sell-score.ts`, `src/lib/engine/buy-score.ts`

Reason strings (human-readable text) are built by conditional `if` statements in each function. To add, remove, or change thresholds:
- Edit the conditional blocks in the "Reasons" sections
- The `reasons` array affects only display text, not the numeric score

To change numeric sell urgency, edit the `rawSellScore` component variables (e.g., increase `priceFallContrib` from `0.08` to `0.12`).

### Changing the Horizon Options

**File:** `src/types/ui.ts`

`HorizonGW = 1 | 3 | 5` is a union type. To add `2` as an option:
1. Update the type to `HorizonGW = 1 | 2 | 3 | 5`
2. Add the button in `src/components/layout/GWSelector.tsx` (`OPTIONS` array)
3. Add the button in `src/components/planner/PlannerView.tsx` (inline `[1, 3, 5]` array)

### Changing DGW/BGW Rotation Penalty

**File:** `src/lib/engine/projected-points.ts`

```typescript
// Change 0.80 to adjust how much credit extra fixtures get (0 = no DGW boost, 1 = full 2x boost)
fixtureScale = 1 + (fixtureCount - expectedGames) * 0.80 / expectedGames;
```

The same constant appears independently in `OptimizedXI.tsx` (`computeBestPredictedXI`) and `GWHistoryPanel.tsx` (`calcPerGWPrediction`). **All three locations must be updated together** — consider extracting to a shared constant.

### Adding True Transfer Cost Awareness

Currently `freeTransfers` is hardcoded to `1`. To derive it from `TeamHistory`:

```typescript
const lastGW = history.current[history.current.length - 1];
const freeTransfers = lastGW.event_transfers > 1 ? 1 : 2; // max 2 carry-over
```

Then subtract `max(0, transferCount - freeTransfers) * 4` from `netGain` in `transfer-engine.ts`.

### Key Dependencies to Watch

| If you change... | Also check... |
|---|---|
| `scorePlayer()` return shape | `lineup-optimizer.ts`, `sell-score.ts`, `buy-score.ts`, `HorizonTable.tsx` |
| `EngineWeights` keys | `weights.ts`, `projected-points.ts`, `types/engine.ts` |
| `findBestXI()` return type | `GWHistoryPanel.tsx`, `OptimizedXI.tsx` |
| `VALID_FORMATIONS` | `lineup-optimizer.ts`, `best-xi.ts` (both iterate over it) |
| `gwRange` derivation | Every engine function — they all accept it as a parameter |
| `teamFixtureCount()` | `projected-points.ts`, `buy-score.ts`, `sell-score.ts`, `OptimizedXI.tsx`, `GWHistoryPanel.tsx` — DGW constant 0.80 repeated in 3 locations |
