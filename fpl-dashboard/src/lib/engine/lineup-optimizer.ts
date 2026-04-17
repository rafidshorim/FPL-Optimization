import type { Player, Pick, Fixture } from "@/types/fpl";
import type { OptimizedXI, Formation, FormationDef, EngineWeights } from "@/types/engine";
import { scorePlayer } from "./projected-points";
import { VALID_FORMATIONS, POSITION_IDS } from "../utils/constants";
import { DEFAULT_WEIGHTS } from "./weights";

/**
 * Optimizes the starting XI from the current squad of 15 picks.
 *
 * For each valid FPL formation:
 *   1. Pick the top GK by projected score
 *   2. Pick top N DEF by projected score
 *   3. Pick top N MID by projected score
 *   4. Pick top N FWD by projected score
 *   5. Sum projected scores for the 11 starters
 *
 * Select the formation with the highest projected total.
 * Captain = highest single-GW projected score player.
 * Bench order = remaining 4 sorted by projected score (descending).
 */
export function optimizeXI(
  picks: Pick[],
  allPlayers: Player[],
  fixtures: Fixture[],
  gwRange: number[],
  weights: EngineWeights = DEFAULT_WEIGHTS
): OptimizedXI {
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  // Score all 15 squad players
  const scoredPicks = picks
    .map((pick) => {
      const player = playerMap.get(pick.element);
      if (!player) return null;
      const projected = scorePlayer(player, fixtures, gwRange, weights);
      return { pick, player, score: projected.score };
    })
    .filter(
      (
        x
      ): x is { pick: Pick; player: Player; score: number } => x !== null
    );

  const byPosition: Record<number, typeof scoredPicks> = {
    [POSITION_IDS.GKP]: [],
    [POSITION_IDS.DEF]: [],
    [POSITION_IDS.MID]: [],
    [POSITION_IDS.FWD]: [],
  };

  for (const sp of scoredPicks) {
    byPosition[sp.player.element_type]?.push(sp);
  }

  // Sort each group by score descending
  for (const group of Object.values(byPosition)) {
    group.sort((a, b) => b.score - a.score);
  }

  let bestTotal = -Infinity;
  let bestFormation: FormationDef = VALID_FORMATIONS[3]; // default 4-3-3
  let bestStarters: typeof scoredPicks = [];

  for (const formation of VALID_FORMATIONS) {
    const gks = byPosition[POSITION_IDS.GKP].slice(0, 1);
    const defs = byPosition[POSITION_IDS.DEF].slice(0, formation.def);
    const mids = byPosition[POSITION_IDS.MID].slice(0, formation.mid);
    const fwds = byPosition[POSITION_IDS.FWD].slice(0, formation.fwd);

    // Formation is only valid if we have enough players in each position
    if (
      gks.length < 1 ||
      defs.length < formation.def ||
      mids.length < formation.mid ||
      fwds.length < formation.fwd
    ) {
      continue;
    }

    const starters = [...gks, ...defs, ...mids, ...fwds];
    const total = starters.reduce((s, sp) => s + sp.score, 0);

    if (total > bestTotal) {
      bestTotal = total;
      bestFormation = formation;
      bestStarters = starters;
    }
  }

  const starterIds = new Set(bestStarters.map((sp) => sp.pick.element));

  // Bench = the remaining 4 players, sorted by projected score descending
  const bench = scoredPicks
    .filter((sp) => !starterIds.has(sp.pick.element))
    .sort((a, b) => b.score - a.score);

  // Captain = highest projected score among starters
  const captain = bestStarters.reduce((best, sp) =>
    sp.score > best.score ? sp : best
  );

  // Vice captain = second highest
  const remainingStarters = bestStarters.filter(
    (sp) => sp.pick.element !== captain.pick.element
  );
  const viceCaptain =
    remainingStarters.length > 0
      ? remainingStarters.reduce((best, sp) => (sp.score > best.score ? sp : best))
      : bestStarters[1] ?? captain;

  // Determine current formation from picks (positions 1–11)
  const currentFormation = detectCurrentFormation(picks, playerMap);

  // Projected gain: compare best starters total vs what user currently has starting
  const currentStarterIds = new Set(
    picks.filter((p) => p.position <= 11).map((p) => p.element)
  );
  const currentTotal = scoredPicks
    .filter((sp) => currentStarterIds.has(sp.pick.element))
    .reduce((s, sp) => s + sp.score, 0);

  return {
    formation: bestFormation.name,
    starters: bestStarters.map((sp) => sp.pick.element),
    bench: bench.map((sp) => sp.pick.element),
    captain: captain.pick.element,
    viceCaptain: viceCaptain.pick.element,
    totalProjectedPoints: bestTotal,
    currentFormation,
    projectedGainVsCurrent: bestTotal - currentTotal,
  };
}

function detectCurrentFormation(
  picks: Pick[],
  playerMap: Map<number, Player>
): Formation | null {
  const starters = picks.filter((p) => p.position <= 11);
  let def = 0, mid = 0, fwd = 0;

  for (const pick of starters) {
    const player = playerMap.get(pick.element);
    if (!player) continue;
    if (player.element_type === POSITION_IDS.DEF) def++;
    else if (player.element_type === POSITION_IDS.MID) mid++;
    else if (player.element_type === POSITION_IDS.FWD) fwd++;
  }

  const key = `${def}-${mid}-${fwd}` as Formation;
  const valid = VALID_FORMATIONS.map((f) => f.name) as string[];
  return valid.includes(key) ? (key as Formation) : null;
}
