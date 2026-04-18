import type { EngineWeights } from "@/types/engine";

// All weights sum to 1.0.
// positionGoalBonus replaces the old generic xGI — it now accounts for
// official FPL goal pts by position (GK=10, DEF=6, MID=5, FWD=4).
// cleanSheetProb rewards GK/DEF far more than MID (4 vs 1 pts per CS).
// defContribution proxies the +2 CBI bonus for high-tackle/intercept defenders.
export const DEFAULT_WEIGHTS: EngineWeights = {
  form:                0.20,  // Rolling 5-GW form (reduced from 0.25)
  ppg:                 0.17,  // Season points-per-game
  epNext:              0.18,  // FPL's own ep_next signal
  ictIndex:            0.08,  // ICT attacking involvement
  fixtureEase:         0.12,  // 1 - (avgFDR / 5) over horizon
  minutesProbability:  0.07,  // Derived from chance_of_playing_next_round
  positionGoalBonus:   0.05,  // xG×positionGoalFactor + xA×3, normalized
  cleanSheetProb:      0.10,  // CS rate × fixture × official CS pts value
  defContribution:     0.03,  // Bonus pts per start proxy for CBI bonus
};
