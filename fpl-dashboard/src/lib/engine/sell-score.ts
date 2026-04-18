import type { Player, Pick, Fixture } from "@/types/fpl";
import type { SellCandidate, EngineWeights } from "@/types/engine";
import { scorePlayer } from "./projected-points";
import { avgDifficulty, teamFixtureCount } from "./fixture-difficulty";
import { DEFAULT_WEIGHTS } from "./weights";

/**
 * Computes a sell urgency score (0–1) for a player already in your squad.
 * Higher score = stronger recommendation to sell.
 *
 * Position-aware logic based on official FPL scoring:
 *  - GK/DEF clean sheet = 4pts: don't sell on fixture difficulty alone
 *  - Disciplinary history: yellow/red card rates are real point risks
 *  - Penalty miss risk: takers with past misses carry -2pt risk
 *  - Goals conceded: GK/DEF lose -1pt per 2 goals conceded
 */
export function sellScore(
  pick: Pick,
  player: Player,
  fixtures: Fixture[],
  gwRange: number[],
  weights: EngineWeights = DEFAULT_WEIGHTS
): SellCandidate {
  const projected = scorePlayer(player, fixtures, gwRange, weights);
  const projScore = projected.score;

  const reasons: string[] = [];

  // ── DGW / BGW detection ───────────────────────────────────────────────
  const fixtureCount  = teamFixtureCount(player.team, fixtures, gwRange);
  const expectedGames = Math.max(1, gwRange.length);
  if (fixtureCount === 0) {
    reasons.push("Blank gameweek — no fixture, scores 0 pts");
  } else if (fixtureCount > expectedGames) {
    reasons.push(`Double gameweek — keep for extra fixture value`);
  }

  // ── Availability ──────────────────────────────────────────────────────
  if (player.status === "u") {
    reasons.push("Unavailable for selection");
  } else if (player.status === "i") {
    reasons.push("Injured — return date unclear");
  } else if (player.status === "s") {
    reasons.push("Suspended");
  }

  if (player.chance_of_playing_next_round !== null) {
    if (player.chance_of_playing_next_round < 50) {
      reasons.push("High rotation risk — low chance of playing");
    } else if (player.chance_of_playing_next_round < 75) {
      reasons.push("Injury doubt — uncertain availability");
    }
  }

  // ── Performance ───────────────────────────────────────────────────────
  if (projScore < 3.0) {
    reasons.push("Poor projected output this horizon");
  } else if (projScore < 4.5) {
    reasons.push("Below-average projected score");
  }

  // ── Fixture difficulty ────────────────────────────────────────────────
  const fdr = avgDifficulty(player.team, fixtures, gwRange);

  // For GK/DEF: fixture difficulty matters less because they can still score
  // from defensive contributions and CS bonus (4pts) even vs tough teams.
  // Only flag if FDR is very high AND clean sheet rate is poor.
  const isDefender = player.element_type <= 2;
  const csPerGame  = player.clean_sheets_per_90;

  if (isDefender) {
    if (fdr >= 4.5 && csPerGame < 0.2) {
      reasons.push("Very tough fixtures with poor clean sheet record");
    } else if (fdr >= 4.0 && csPerGame < 0.15) {
      reasons.push("Hard fixtures — unlikely to keep clean sheets");
    }
  } else {
    if (fdr >= 4.0) {
      reasons.push("Very difficult upcoming fixtures");
    } else if (fdr >= 3.5) {
      reasons.push("Tough fixture run ahead");
    }
  }

  // ── Disciplinary risk (official: yellow=-1pt, red=-3pts) ──────────────
  const yellowRate = player.starts > 0 ? player.yellow_cards / player.starts : 0;
  const redRate    = player.starts > 0 ? player.red_cards    / player.starts : 0;

  if (redRate > 0.05) {
    reasons.push("Red card risk — suspension cost -3pts per game");
  }
  if (yellowRate > 0.3) {
    reasons.push("Frequent bookings — yellow card risk (-1pt)");
  }

  // ── Penalty miss risk (official: penalty miss = -2pts) ────────────────
  if (player.penalties_order === 1 && parseFloat(player.form) < 4) {
    reasons.push("Penalty taker in poor form — miss risk (-2pts)");
  }

  // ── Goals conceded penalty — GK/DEF only (official: -1pt per 2 goals) ─
  if (isDefender && player.expected_goals_conceded_per_90 > 1.5) {
    reasons.push("High goals-conceded rate — regular -1pt deductions");
  }

  // ── Price & transfer momentum ─────────────────────────────────────────
  if (player.cost_change_event < 0) {
    reasons.push("Price falling this gameweek");
  }
  if (parseFloat(player.selected_by_percent) < 5 && parseFloat(player.form) < 3) {
    reasons.push("Falling ownership with poor form");
  }
  if (player.transfers_out_event > 100_000) {
    reasons.push("Heavy FPL transfers out this week");
  }

  // ── Compute sell urgency score ────────────────────────────────────────
  const lowProjContrib = (1 - projScore / 10) * 0.45;

  const injuryContrib =
    player.status === "u" || player.status === "i" ? 0.30 :
    player.status === "d" ? 0.15 :
    player.status === "s" ? 0.25 :
    0;

  const priceFallContrib = player.cost_change_event < 0 ? 0.08 : 0;

  // Fixture contrib: dampened for GK/DEF because CS value is fixture-independent
  const fdrContrib = isDefender
    ? Math.max(0, (fdr - 3.5) / 4) * 0.05  // half weight for defenders
    : Math.max(0, (fdr - 3)   / 4) * 0.10;

  // Disciplinary penalty contribution
  const disciplineContrib = Math.min(0.08, yellowRate * 0.1 + redRate * 0.2);

  // BGW adds urgency (player scores 0), DGW reduces urgency (extra value)
  const dgwContrib = fixtureCount === 0 ? 0.20 : fixtureCount > expectedGames ? -0.10 : 0;

  const rawSellScore =
    lowProjContrib + injuryContrib + priceFallContrib + fdrContrib + disciplineContrib + dgwContrib;

  const salePrice = pick.selling_price ?? player.now_cost;

  return {
    playerId: player.id,
    sellScore: Math.min(1, rawSellScore),
    salePrice,
    projectedScore: projScore,
    reasons,
  };
}
