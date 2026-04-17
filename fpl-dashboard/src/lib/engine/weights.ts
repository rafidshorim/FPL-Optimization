import type { EngineWeights } from "@/types/engine";

// All scoring weights sum to 1.0.
// Adjust these values to change how the recommendation engine prioritises factors.
export const DEFAULT_WEIGHTS: EngineWeights = {
  form: 0.25,              // Rolling 5-GW average implied by FPL form field
  ppg: 0.20,               // Season points-per-game (longevity signal)
  epNext: 0.20,            // FPL's own ep_next expected-points signal
  ictIndex: 0.10,          // Normalised ICT index (attacking involvement proxy)
  fixtureEase: 0.15,       // 1 - (avgFDR / 5) over the selected GW horizon
  minutesProbability: 0.08, // Derived from chance_of_playing_next_round
  xGI: 0.02,               // Expected goal involvements per 90 (attacking bonus)
};
