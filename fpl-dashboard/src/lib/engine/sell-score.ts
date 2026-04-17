import type { Player, Pick, Fixture } from "@/types/fpl";
import type { SellCandidate, EngineWeights } from "@/types/engine";
import { scorePlayer } from "./projected-points";
import { avgDifficulty } from "./fixture-difficulty";
import { DEFAULT_WEIGHTS } from "./weights";

/**
 * Computes a sell urgency score (0–1) for a player already in your squad.
 * Higher score = stronger recommendation to sell.
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

  // Unavailable / injured
  if (player.status === "u") {
    reasons.push("Unavailable for selection");
  } else if (player.status === "i") {
    reasons.push("Injured — return date unclear");
  } else if (player.status === "s") {
    reasons.push("Suspended");
  }

  // Low chance of playing
  if (
    player.chance_of_playing_next_round !== null &&
    player.chance_of_playing_next_round < 50
  ) {
    reasons.push("High rotation risk — low chance of playing");
  } else if (
    player.chance_of_playing_next_round !== null &&
    player.chance_of_playing_next_round < 75
  ) {
    reasons.push("Injury doubt — uncertain availability");
  }

  // Poor projected performance
  if (projScore < 3.0) {
    reasons.push("Poor projected output next GW");
  } else if (projScore < 4.5) {
    reasons.push("Below-average projected score");
  }

  // Difficult upcoming fixtures
  const fdr = avgDifficulty(player.team, fixtures, gwRange);
  if (fdr >= 4.0) {
    reasons.push("Very difficult upcoming fixtures");
  } else if (fdr >= 3.5) {
    reasons.push("Tough fixture run ahead");
  }

  // Falling price
  if (player.cost_change_event < 0) {
    reasons.push("Price falling this gameweek");
  }

  // Declining ownership + poor form
  if (
    parseFloat(player.selected_by_percent) < 5 &&
    parseFloat(player.form) < 3
  ) {
    reasons.push("Falling ownership with poor form");
  }

  // High transfers out
  if (player.transfers_out_event > 100000) {
    reasons.push("Heavy FPL transfers out this week");
  }

  // Compute sell score: combination of low projected pts + availability + price drop
  const lowProjContrib = (1 - projScore / 10) * 0.5;
  const injuryContrib =
    player.status === "u" || player.status === "i"
      ? 0.3
      : player.status === "d"
      ? 0.15
      : 0;
  const priceFallContrib = player.cost_change_event < 0 ? 0.1 : 0;
  const fdrContrib = Math.max(0, (fdr - 3) / 4) * 0.1;

  const rawSellScore =
    lowProjContrib + injuryContrib + priceFallContrib + fdrContrib;
  const sellScoreNorm = Math.min(1, rawSellScore);

  // Selling price: use the actual selling_price from picks if available,
  // otherwise approximate with now_cost (doesn't account for profit split).
  const salePrice = pick.selling_price ?? player.now_cost;

  return {
    playerId: player.id,
    sellScore: sellScoreNorm,
    salePrice,
    projectedScore: projScore,
    reasons,
  };
}
