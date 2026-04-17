import type { FormationDef } from "@/types/engine";

export const FPL_BASE_URL = "https://fantasy.premierleague.com/api";

export const POSITION_IDS = {
  GKP: 1,
  DEF: 2,
  MID: 3,
  FWD: 4,
} as const;

export const POSITION_NAMES: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export const VALID_FORMATIONS: FormationDef[] = [
  { name: "3-4-3", def: 3, mid: 4, fwd: 3 },
  { name: "3-5-2", def: 3, mid: 5, fwd: 2 },
  { name: "4-4-2", def: 4, mid: 4, fwd: 2 },
  { name: "4-3-3", def: 4, mid: 3, fwd: 3 },
  { name: "4-5-1", def: 4, mid: 5, fwd: 1 },
  { name: "5-4-1", def: 5, mid: 4, fwd: 1 },
  { name: "5-3-2", def: 5, mid: 3, fwd: 2 },
  { name: "5-2-3", def: 5, mid: 2, fwd: 3 },
];

export const STATUS_LABELS: Record<string, string> = {
  a: "Available",
  d: "Doubtful",
  i: "Injured",
  u: "Unavailable",
  s: "Suspended",
  n: "Not in squad",
};
