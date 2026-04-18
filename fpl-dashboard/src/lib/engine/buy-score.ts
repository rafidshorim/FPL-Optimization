import type { Player, Fixture } from "@/types/fpl";
import type { BuyCandidate, EngineWeights } from "@/types/engine";
import { scorePlayer } from "./projected-points";
import { avgDifficulty, teamFixtureCount } from "./fixture-difficulty";
import { DEFAULT_WEIGHTS } from "./weights";

// Official FPL goal pts by position
const GOAL_PTS: Record<number, number> = { 1: 10, 2: 6, 3: 5, 4: 4 };

/**
 * Scores a free-agent player as a buy target (0–10).
 * Position-aware based on official FPL scoring rules.
 */
export function buyScore(
  player: Player,
  fixtures: Fixture[],
  gwRange: number[],
  weights: EngineWeights = DEFAULT_WEIGHTS
): BuyCandidate {
  const projected = scorePlayer(player, fixtures, gwRange, weights);
  const projScore = projected.score;

  const priceInMillions = player.now_cost / 10;
  const vmRatio = priceInMillions > 0 ? projScore / priceInMillions : 0;
  const rawBuy = projScore * 0.7 + Math.min(vmRatio * 3, 3) * 0.3;
  const finalScore = Math.min(10, rawBuy);

  const reasons: string[] = [];
  const fdr = avgDifficulty(player.team, fixtures, gwRange);
  const isDefender = player.element_type <= 2;

  // ── DGW / BGW detection ───────────────────────────────────────────────
  const fixtureCount  = teamFixtureCount(player.team, fixtures, gwRange);
  const expectedGames = Math.max(1, gwRange.length);
  if (fixtureCount === 0) {
    reasons.push("⚠ Blank gameweek — no fixture, scores 0 pts");
  } else if (fixtureCount > expectedGames) {
    const extra = fixtureCount - expectedGames;
    reasons.push(`Double gameweek — ${extra} extra fixture${extra > 1 ? "s" : ""}, ~${Math.round(80 * extra)}% more pts expected`);
  }

  // ── Form ──────────────────────────────────────────────────────────────
  const form = parseFloat(player.form);
  if (form >= 7) reasons.push("Excellent recent form");
  else if (form >= 5) reasons.push("Good recent form");

  // ── Fixtures ──────────────────────────────────────────────────────────
  if (fdr < 2.0) reasons.push("Very easy upcoming fixtures");
  else if (fdr < 2.5) reasons.push("Favourable fixture run");

  // ── Expected points ───────────────────────────────────────────────────
  const epNext = parseFloat(player.ep_next);
  if (epNext >= 8) reasons.push("Elite expected points this GW");
  else if (epNext >= 6) reasons.push("High expected points this GW");

  // ── Position-weighted goal value ──────────────────────────────────────
  // Official: DEF goals = 6pts (50% more than FWD 4pts), MID = 5pts.
  // Flag defenders/midfielders with strong xG involvement — rare but huge value.
  const goalPtsFactor = (GOAL_PTS[player.element_type] ?? 4) / 4;
  const effectiveXGI = player.expected_goals_per_90 * goalPtsFactor
                     + player.expected_assists_per_90;
  if (player.element_type === 2 && player.expected_goals_per_90 > 0.1) {
    reasons.push(`Attacking DEF — goals worth ${GOAL_PTS[2]}pts each`);
  } else if (player.element_type === 3 && effectiveXGI > 0.5) {
    reasons.push("Goal-involved MID — goals worth 5pts each");
  } else if (player.element_type === 4 && effectiveXGI > 0.7) {
    reasons.push("High-volume attacker");
  }

  // ── Clean sheet premium (GK/DEF) ─────────────────────────────────────
  // Official: GK/DEF clean sheet = 4pts vs MID = 1pt.
  if (isDefender) {
    if (player.clean_sheets_per_90 >= 0.4 && fdr < 3.0) {
      reasons.push("Strong CS record + easy fixtures (4pts per CS)");
    } else if (player.clean_sheets_per_90 >= 0.3) {
      reasons.push("Reliable clean sheet potential (4pts)");
    }
    // Low xGC = defensive solidity signal
    if (player.expected_goals_conceded_per_90 < 1.0) {
      reasons.push("Excellent defensive record — low xGC");
    }
  }

  // ── Defensive contribution bonus (CBI) ────────────────────────────────
  // Official: DEF earns +2pts for 10+ tackles/blocks/interceptions per match.
  // Proxy: high bonus pts per start = consistently topping BPS via defense.
  if (isDefender && player.starts > 3) {
    const bonusPerStart = player.bonus / player.starts;
    if (bonusPerStart >= 0.8) {
      reasons.push("High defensive contribution — consistent bonus pts");
    }
  }

  // ── GK-specific: saves bonus ──────────────────────────────────────────
  // Official: every 3 saves = +1pt.
  if (player.element_type === 1 && player.starts > 3) {
    const savesPerStart = player.saves / player.starts;
    if (savesPerStart >= 3.5) {
      reasons.push("High save rate — earns save bonus pts regularly");
    }
  }

  // ── Transfer momentum ────────────────────────────────────────────────
  if (player.transfers_in_event >= 200_000) reasons.push("Mass FPL transfer target this week");
  else if (player.transfers_in_event >= 50_000) reasons.push("Popular transfer target");

  // ── Attacking indicators ──────────────────────────────────────────────
  if (player.ict_index_rank <= 5)  reasons.push("Top-5 ICT index in the league");
  else if (player.ict_index_rank <= 20) reasons.push("Elite attacking involvement (ICT)");

  if (parseFloat(player.selected_by_percent) < 10 && projScore >= 6) {
    reasons.push("Strong differential — low ownership");
  }

  if (vmRatio >= 0.8) reasons.push("Excellent value for money");
  if (player.penalties_order === 1) reasons.push("Designated penalty taker");
  if (player.in_dreamteam) reasons.push("Currently in FPL Dream Team");

  // ── Disciplinary warning ──────────────────────────────────────────────
  const yellowRate = player.starts > 0 ? player.yellow_cards / player.starts : 0;
  if (yellowRate > 0.35) reasons.push("⚠ Frequent bookings — yellow card risk (-1pt)");

  return {
    playerId: player.id,
    buyScore: finalScore,
    cost: player.now_cost,
    projectedScore: projScore,
    reasons,
  };
}
