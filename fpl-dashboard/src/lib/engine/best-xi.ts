import { VALID_FORMATIONS } from "@/lib/utils/constants";

export interface PlayerScore {
  id: number;
  elementType: number; // 1=GK 2=DEF 3=MID 4=FWD
  score: number;       // actual pts OR predicted pts in real FPL scale
}

export interface BestXIResult {
  starterIds: number[];
  captainId: number;
  totalWithCaptain: number; // sum of XI + captain's pts once more (2x bonus)
  formation: string;
}

/**
 * Finds the optimal starting XI and captain from a squad of players.
 * Tries every valid FPL formation (see VALID_FORMATIONS) and returns
 * whichever combination maximises totalWithCaptain.
 *
 * Works for both actual historical points and predicted points —
 * the caller decides what `score` means.
 */
export function findBestXI(players: PlayerScore[]): BestXIResult {
  const byType = (t: number) =>
    players.filter((p) => p.elementType === t).sort((a, b) => b.score - a.score);

  const gks = byType(1);
  const defs = byType(2);
  const mids = byType(3);
  const fwds = byType(4);

  let best: BestXIResult | null = null;

  for (const { name, def, mid, fwd } of VALID_FORMATIONS) {
    if (gks.length < 1 || defs.length < def || mids.length < mid || fwds.length < fwd) continue;

    const starters = [gks[0], ...defs.slice(0, def), ...mids.slice(0, mid), ...fwds.slice(0, fwd)];
    const base = starters.reduce((s, p) => s + p.score, 0);
    const captain = starters.reduce((m, p) => (p.score > m.score ? p : m));
    const totalWithCaptain = base + captain.score; // captain's pts added once more

    if (!best || totalWithCaptain > best.totalWithCaptain) {
      best = { starterIds: starters.map((p) => p.id), captainId: captain.id, totalWithCaptain, formation: name };
    }
  }

  // Fallback: shouldn't be reached with a valid 15-player squad
  if (!best) {
    const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 11);
    const cap = sorted[0] ?? players[0];
    best = {
      starterIds: sorted.map((p) => p.id),
      captainId: cap?.id ?? -1,
      totalWithCaptain: sorted.reduce((s, p) => s + p.score, 0) + (cap?.score ?? 0),
      formation: "4-3-3",
    };
  }

  return best;
}
