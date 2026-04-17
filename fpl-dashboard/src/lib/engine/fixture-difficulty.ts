import type { Fixture } from "@/types/fpl";

/**
 * Returns the average fixture difficulty for a team over the given GW range.
 * Falls back to 3.0 (neutral) if no fixtures are found.
 */
export function avgDifficulty(
  teamId: number,
  fixtures: Fixture[],
  gwRange: number[]
): number {
  const gwSet = new Set(gwRange);
  const relevant = fixtures.filter(
    (f) =>
      f.event !== null &&
      gwSet.has(f.event) &&
      !f.finished &&
      (f.team_h === teamId || f.team_a === teamId)
  );

  if (relevant.length === 0) return 3.0;

  const total = relevant.reduce((sum, f) => {
    const difficulty = f.team_h === teamId ? f.team_h_difficulty : f.team_a_difficulty;
    return sum + difficulty;
  }, 0);

  return total / relevant.length;
}

/**
 * Returns upcoming fixture info for a team (for display in UI).
 */
export interface UpcomingFixture {
  event: number;
  opponentId: number;
  isHome: boolean;
  difficulty: number;
}

export function getUpcomingFixtures(
  teamId: number,
  fixtures: Fixture[],
  gwRange: number[]
): UpcomingFixture[] {
  const gwSet = new Set(gwRange);
  return fixtures
    .filter(
      (f) =>
        f.event !== null &&
        gwSet.has(f.event) &&
        (f.team_h === teamId || f.team_a === teamId)
    )
    .map((f) => ({
      event: f.event as number,
      opponentId: f.team_h === teamId ? f.team_a : f.team_h,
      isHome: f.team_h === teamId,
      difficulty: f.team_h === teamId ? f.team_h_difficulty : f.team_a_difficulty,
    }))
    .sort((a, b) => a.event - b.event);
}
