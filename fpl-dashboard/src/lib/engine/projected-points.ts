import type { Player, Fixture } from "@/types/fpl";
import type { ProjectedPoints, EngineWeights } from "@/types/engine";
import { avgDifficulty, teamFixtureCount } from "./fixture-difficulty";
import { DEFAULT_WEIGHTS } from "./weights";

// Official FPL scoring: points per goal by position
const GOAL_PTS: Record<number, number> = { 1: 10, 2: 6, 3: 5, 4: 4 };

// Official FPL scoring: clean sheet pts by position (GK/DEF=4, MID=1, FWD=0)
const CS_PTS: Record<number, number> = { 1: 4, 2: 4, 3: 1, 4: 0 };

/**
 * Scores a single player on a 0–10 scale for the given GW horizon.
 *
 * DGW/BGW aware:
 *   - BGW (0 fixtures in range) → score = 0 immediately
 *   - DGW (extra fixture) → per-game contributions scaled by +80% per extra game
 *   - Partial BGW (fewer fixtures than GWs) → contributions scaled down proportionally
 *
 * Position-aware based on official FPL scoring:
 *   - Goals: GK=10pts, DEF=6pts, MID=5pts, FWD=4pts
 *   - Clean sheets: GK/DEF=4pts, MID=1pt, FWD=0pts
 *   - Defensive contribution (+2pts CBI bonus) proxied via bonus pts per start
 *   - Disciplinary: yellow=-1pt, red=-3pts (direct deduction)
 */
export function scorePlayer(
  player: Player,
  fixtures: Fixture[],
  gwRange: number[],
  weights: EngineWeights = DEFAULT_WEIGHTS
): ProjectedPoints {
  const ZERO_BREAKDOWN = {
    formContrib: 0, ppgContrib: 0, epContrib: 0, ictContrib: 0,
    fixtureContrib: 0, minutesContrib: 0, positionGoalContrib: 0,
    cleanSheetContrib: 0, defContrib: 0, disciplinaryPenalty: 0,
  };

  // ── DGW / BGW detection ───────────────────────────────────────────────
  const fixtureCount   = teamFixtureCount(player.team, fixtures, gwRange);
  const expectedGames  = Math.max(1, gwRange.length);

  // BGW: no upcoming fixture → player scores 0
  if (fixtureCount === 0) {
    return { playerId: player.id, score: 0, breakdown: ZERO_BREAKDOWN };
  }

  // Per-game scale factor applied to all per-match contributions:
  //   normal  → 1.0
  //   DGW     → 1 + extra_games × 0.80 (80% of normal per extra fixture, rotation risk)
  //   partial → fixtureCount / expectedGames
  const fixtureScale =
    fixtureCount > expectedGames
      ? 1 + (fixtureCount - expectedGames) * 0.80 / expectedGames
      : fixtureCount / expectedGames;

  // ── Availability probability ──────────────────────────────────────────
  let minuteProb =
    player.chance_of_playing_next_round === null
      ? 0.95
      : player.chance_of_playing_next_round / 100;

  const fdr         = avgDifficulty(player.team, fixtures, gwRange);
  const fixtureEase = 1 - fdr / 5.0;

  // ── Standard per-game factors ─────────────────────────────────────────
  const normForm = Math.min(parseFloat(player.form) / 12.0, 1.0);
  const normPPG  = Math.min(parseFloat(player.points_per_game) / 15.0, 1.0);
  const normEP   = Math.min(parseFloat(player.ep_next) / 15.0, 1.0);
  const normICT  = Math.min(parseFloat(player.ict_index) / 100.0, 1.0);

  // ── Position-weighted goal bonus ─────────────────────────────────────
  const goalPtsFactor   = (GOAL_PTS[player.element_type] ?? 4) / 4;
  const xgAdj           = player.expected_goals_per_90 * goalPtsFactor;
  const xaAdj           = player.expected_assists_per_90;
  const normPositionGoal = Math.min(1.0, (xgAdj + xaAdj) / 1.2);

  // ── Clean sheet contribution ─────────────────────────────────────────
  const csValue  = CS_PTS[player.element_type] ?? 0;
  const normCS   = csValue > 0
    ? (() => {
        const csRateBase = Math.min(player.clean_sheets_per_90, 0.8);
        const csRateAdj  = csRateBase * (0.4 + fixtureEase * 0.8);
        return Math.min(1.0, (csRateAdj * csValue) / 4.0);
      })()
    : 0;

  // ── Defensive contribution proxy ─────────────────────────────────────
  const bonusPerStart  = player.starts > 0 ? player.bonus / player.starts : 0;
  const normDefContrib = player.element_type <= 2
    ? Math.min(1.0, bonusPerStart / 1.0)
    : Math.min(1.0, bonusPerStart / 1.8);

  // ── Disciplinary penalty ─────────────────────────────────────────────
  const yellowRate          = player.starts > 0 ? player.yellow_cards / player.starts : 0;
  const redRate             = player.starts > 0 ? player.red_cards    / player.starts : 0;
  const disciplinaryPenalty = Math.min(0.5, yellowRate * 1.0 + redRate * 3.0);

  // ── Weighted sum — per-game factors scaled by fixtureScale ───────────
  // fixtureEase is fixture quality (not quantity) — no fixtureScale applied
  const formContrib         = weights.form               * normForm         * fixtureScale;
  const ppgContrib          = weights.ppg                * normPPG          * fixtureScale;
  const epContrib           = weights.epNext             * normEP           * fixtureScale;
  const ictContrib          = weights.ictIndex           * normICT          * fixtureScale;
  const fixtureContrib      = weights.fixtureEase        * fixtureEase; // quality, no scale
  const minutesContrib      = weights.minutesProbability * minuteProb       * fixtureScale;
  const positionGoalContrib = weights.positionGoalBonus  * normPositionGoal * fixtureScale;
  const cleanSheetContrib   = weights.cleanSheetProb     * normCS           * fixtureScale;
  const defContrib          = weights.defContribution    * normDefContrib   * fixtureScale;
  // Disciplinary risk also scales with fixture count (more games = more card chances)
  const scaledDisciplinary  = disciplinaryPenalty        * fixtureScale     * 0.5;

  const rawScore =
    formContrib +
    ppgContrib +
    epContrib +
    ictContrib +
    fixtureContrib +
    minutesContrib +
    positionGoalContrib +
    cleanSheetContrib +
    defContrib -
    scaledDisciplinary;

  let score = rawScore * 10;

  if (player.status === "u") {
    score = 0;
  } else if (player.status === "i") {
    score *= 0.1;
  } else if (player.status === "d") {
    score *= minuteProb;
  }

  score = Math.max(0, Math.min(10, score));

  return {
    playerId: player.id,
    score,
    breakdown: {
      formContrib,
      ppgContrib,
      epContrib,
      ictContrib,
      fixtureContrib,
      minutesContrib,
      positionGoalContrib,
      cleanSheetContrib,
      defContrib,
      disciplinaryPenalty,
    },
  };
}
