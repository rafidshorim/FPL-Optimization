import type { Player, Fixture } from "@/types/fpl";
import type { BuyCandidate, EngineWeights } from "@/types/engine";
import { scorePlayer } from "./projected-points";
import { avgDifficulty } from "./fixture-difficulty";
import { DEFAULT_WEIGHTS } from "./weights";

/**
 * Scores a free-agent player as a buy target (0–10).
 * Combines projected points score with value-for-money bonus.
 */
export function buyScore(
  player: Player,
  fixtures: Fixture[],
  gwRange: number[],
  weights: EngineWeights = DEFAULT_WEIGHTS
): BuyCandidate {
  const projected = scorePlayer(player, fixtures, gwRange, weights);
  const projScore = projected.score;

  // Value-for-money: reward players who score well relative to their price
  const priceInMillions = player.now_cost / 10;
  const vmRatio = priceInMillions > 0 ? projScore / priceInMillions : 0;

  // Final buy score blends proj pts (70%) with value ratio (30%)
  const rawBuy = projScore * 0.7 + Math.min(vmRatio * 3, 3) * 0.3;
  const finalScore = Math.min(10, rawBuy);

  const reasons: string[] = [];

  // High form
  if (parseFloat(player.form) >= 7) {
    reasons.push("Excellent recent form");
  } else if (parseFloat(player.form) >= 5) {
    reasons.push("Good recent form");
  }

  // Easy fixtures
  const fdr = avgDifficulty(player.team, fixtures, gwRange);
  if (fdr < 2.0) {
    reasons.push("Very easy upcoming fixtures");
  } else if (fdr < 2.5) {
    reasons.push("Favourable fixture run");
  }

  // High expected points
  if (parseFloat(player.ep_next) >= 8) {
    reasons.push("Elite expected points this GW");
  } else if (parseFloat(player.ep_next) >= 6) {
    reasons.push("High expected points this GW");
  }

  // Popular transfer target (wisdom of crowds signal)
  if (player.transfers_in_event >= 200000) {
    reasons.push("Mass FPL transfer target this week");
  } else if (player.transfers_in_event >= 50000) {
    reasons.push("Popular transfer target");
  }

  // Elite ICT rank
  if (player.ict_index_rank <= 5) {
    reasons.push("Top-5 ICT index in the league");
  } else if (player.ict_index_rank <= 20) {
    reasons.push("Elite attacking involvement (ICT)");
  }

  // Low-ownership differential
  if (parseFloat(player.selected_by_percent) < 10 && projScore >= 6) {
    reasons.push("Strong differential — low ownership");
  }

  // Value for money
  if (vmRatio >= 0.8) {
    reasons.push("Excellent value for money");
  }

  // Penalty taker bonus
  if (player.penalties_order === 1) {
    reasons.push("Designated penalty taker");
  }

  // Dream team
  if (player.in_dreamteam) {
    reasons.push("Currently in FPL Dream Team");
  }

  return {
    playerId: player.id,
    buyScore: finalScore,
    cost: player.now_cost,
    projectedScore: projScore,
    reasons,
  };
}
