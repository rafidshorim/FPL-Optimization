export interface EngineWeights {
  form: number;
  ppg: number;
  epNext: number;
  ictIndex: number;
  fixtureEase: number;
  minutesProbability: number;
  positionGoalBonus: number;  // xG/xA weighted by official position goal pts (GK=10,DEF=6,MID=5,FWD=4)
  cleanSheetProb: number;     // CS probability × official CS pts (GK/DEF=4, MID=1, FWD=0)
  defContribution: number;    // Defensive contribution proxy (bonus pts per start)
}

export interface ProjectedPoints {
  playerId: number;
  score: number; // 0–10 scale
  breakdown: {
    formContrib: number;
    ppgContrib: number;
    epContrib: number;
    ictContrib: number;
    fixtureContrib: number;
    minutesContrib: number;
    positionGoalContrib: number;
    cleanSheetContrib: number;
    defContrib: number;
    disciplinaryPenalty: number; // direct deduction (not a weight)
  };
}

export interface SellCandidate {
  playerId: number;
  sellScore: number; // 0–1, higher = stronger sell signal
  salePrice: number; // in tenths (e.g. 75 = £7.5m)
  projectedScore: number;
  reasons: string[];
}

export interface BuyCandidate {
  playerId: number;
  buyScore: number; // 0–10, higher = stronger buy signal
  cost: number; // in tenths
  projectedScore: number;
  reasons: string[];
}

export interface TransferPair {
  out: SellCandidate;
  in: BuyCandidate;
  netGain: number; // buyScore - sellScore (higher = better)
  priceDiff: number; // in tenths, negative means we save money
  reasons: string[];
  rank: number;
}

export type Formation =
  | "3-4-3"
  | "3-5-2"
  | "4-4-2"
  | "4-3-3"
  | "4-5-1"
  | "5-4-1"
  | "5-3-2"
  | "5-2-3";

export interface FormationDef {
  name: Formation;
  def: number;
  mid: number;
  fwd: number;
}

export interface OptimizedXI {
  formation: Formation;
  starters: number[]; // player IDs, sorted by position
  bench: number[]; // player IDs in sub priority order
  captain: number; // player ID
  viceCaptain: number; // player ID
  totalProjectedPoints: number;
  currentFormation: Formation | null; // null if couldn't be determined
  projectedGainVsCurrent: number; // score delta vs user's current picks
}
