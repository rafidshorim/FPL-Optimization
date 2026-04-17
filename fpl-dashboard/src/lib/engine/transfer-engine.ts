import type { Player, Pick, Fixture } from "@/types/fpl";
import type { TransferPair, SellCandidate, BuyCandidate, EngineWeights } from "@/types/engine";
import { sellScore } from "./sell-score";
import { buyScore } from "./buy-score";
import { DEFAULT_WEIGHTS } from "./weights";

export interface TransferContext {
  bank: number; // in tenths (e.g. 8 = £0.8m)
  squadTeamCounts: Record<number, number>; // teamId → count in current squad
  teamLimit: number; // default 3
}

/**
 * Ranks the best OUT→IN transfer pairs given the current squad and context.
 * Returns up to 10 pairs sorted by netGain descending.
 *
 * Logic:
 * 1. Score all squad picks for sell urgency → take top 5 candidates
 * 2. For each sell candidate, find best buy options in the same position
 *    that are affordable and don't violate the 3-player-per-team rule
 * 3. Rank all pairs by (buyScore - sellScore normalised) descending
 * 4. Deduplicate: same player can't appear as "in" in two pairs
 */
export function rankTransfers(
  picks: Pick[],
  squadPlayerIds: Set<number>,
  allPlayers: Player[],
  fixtures: Fixture[],
  gwRange: number[],
  context: TransferContext,
  weights: EngineWeights = DEFAULT_WEIGHTS
): TransferPair[] {
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  // Score every squad player for sell urgency
  const sellCandidates: SellCandidate[] = picks
    .filter((p) => p.position <= 15)
    .map((pick) => {
      const player = playerMap.get(pick.element);
      if (!player) return null;
      return sellScore(pick, player, fixtures, gwRange, weights);
    })
    .filter((s): s is SellCandidate => s !== null)
    .sort((a, b) => b.sellScore - a.sellScore)
    .slice(0, 5); // Consider top 5 sell candidates

  const pairs: TransferPair[] = [];
  const usedBuyIds = new Set<number>();

  for (const candidate of sellCandidates) {
    const outPlayer = playerMap.get(candidate.playerId);
    if (!outPlayer) continue;

    const budget = candidate.salePrice + context.bank;

    // Build buy candidates for the same position
    const buyCandidates: BuyCandidate[] = allPlayers
      .filter((p) => {
        if (p.element_type !== outPlayer.element_type) return false;
        if (squadPlayerIds.has(p.id)) return false; // already in squad
        if (p.now_cost > budget) return false; // can't afford
        if (usedBuyIds.has(p.id)) return false; // already recommended
        // Team limit check: exclude players from a team already at the limit,
        // unless that team is the player being sold
        const currentCount = context.squadTeamCounts[p.team] ?? 0;
        const adjustedCount =
          p.team === outPlayer.team ? currentCount - 1 : currentCount;
        if (adjustedCount >= context.teamLimit) return false;
        return true;
      })
      .map((p) => buyScore(p, fixtures, gwRange, weights))
      .sort((a, b) => b.buyScore - a.buyScore)
      .slice(0, 5);

    for (const buy of buyCandidates) {
      if (usedBuyIds.has(buy.playerId)) continue;

      const buyPlayer = playerMap.get(buy.playerId);
      if (!buyPlayer) continue;

      // netGain: higher buyScore relative to the urgency to sell
      const netGain = buy.buyScore - buy.projectedScore * 0 + buy.projectedScore - candidate.projectedScore;

      const combinedReasons: string[] = [];
      // Add buy reasons
      combinedReasons.push(...buy.reasons.slice(0, 2));
      // Add sell reasons
      if (candidate.reasons.length > 0) {
        combinedReasons.push(`Selling: ${candidate.reasons[0]}`);
      }

      pairs.push({
        out: candidate,
        in: buy,
        netGain,
        priceDiff: buy.cost - candidate.salePrice,
        reasons: combinedReasons,
        rank: 0, // assigned below
      });

      usedBuyIds.add(buy.playerId);
    }
  }

  // Sort by netGain descending, assign ranks
  pairs.sort((a, b) => b.netGain - a.netGain);
  return pairs.slice(0, 10).map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * Computes team counts for the current squad (used in TransferContext).
 */
export function computeSquadTeamCounts(
  picks: Pick[],
  playerMap: Map<number, Player>
): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const pick of picks) {
    const player = playerMap.get(pick.element);
    if (player) {
      counts[player.team] = (counts[player.team] ?? 0) + 1;
    }
  }
  return counts;
}
