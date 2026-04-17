import type { Player, Fixture } from "@/types/fpl";
import type { ProjectedPoints, EngineWeights } from "@/types/engine";
import { avgDifficulty } from "./fixture-difficulty";
import { DEFAULT_WEIGHTS } from "./weights";

/**
 * Scores a single player on a 0–10 scale for the given GW horizon.
 *
 * Scoring formula:
 *   rawScore = Σ(weight × normalizedInput)
 *   projectedScore = rawScore × 10
 *
 * Post-score availability multipliers:
 *   status='u'  → 0     (unavailable)
 *   status='i'  → × 0.1 (injured, likely out)
 *   status='d'  → × minuteProb (doubtful)
 */
export function scorePlayer(
  player: Player,
  fixtures: Fixture[],
  gwRange: number[],
  weights: EngineWeights = DEFAULT_WEIGHTS
): ProjectedPoints {
  // Availability probability
  let minuteProb: number;
  if (player.chance_of_playing_next_round === null) {
    minuteProb = 0.95; // No news = assume fine
  } else {
    minuteProb = player.chance_of_playing_next_round / 100;
  }

  // Normalised inputs (capped at 1.0)
  const normForm = Math.min(parseFloat(player.form) / 12.0, 1.0);
  const normPPG = Math.min(parseFloat(player.points_per_game) / 15.0, 1.0);
  const normEP = Math.min(parseFloat(player.ep_next) / 15.0, 1.0);
  const normICT = Math.min(parseFloat(player.ict_index) / 100.0, 1.0);
  const fdr = avgDifficulty(player.team, fixtures, gwRange);
  const fixtureEase = 1 - fdr / 5.0;
  const normXGI = Math.min(player.expected_goal_involvements_per_90 / 1.5, 1.0);

  const formContrib = weights.form * normForm;
  const ppgContrib = weights.ppg * normPPG;
  const epContrib = weights.epNext * normEP;
  const ictContrib = weights.ictIndex * normICT;
  const fixtureContrib = weights.fixtureEase * fixtureEase;
  const minutesContrib = weights.minutesProbability * minuteProb;
  const xgiContrib = weights.xGI * normXGI;

  const rawScore =
    formContrib +
    ppgContrib +
    epContrib +
    ictContrib +
    fixtureContrib +
    minutesContrib +
    xgiContrib;

  let score = rawScore * 10;

  // Hard availability multipliers applied after weighted sum
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
      xgiContrib,
    },
  };
}
