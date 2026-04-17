"use client";

import type { Player, Pick, Fixture } from "@/types/fpl";
import { scorePlayer } from "@/lib/engine/projected-points";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { StatusDot } from "@/components/shared/StatusDot";
import { POSITION_NAMES } from "@/lib/utils/constants";
import { getUpcomingFixtures } from "@/lib/engine/fixture-difficulty";
import { cn } from "@/lib/utils/cn";

interface HorizonTableProps {
  picks: Pick[];
  players: Player[];
  fixtures: Fixture[];
  gwRange: number[];
  teams: { id: number; short_name: string }[];
}

export function HorizonTable({ picks, players, fixtures, gwRange, teams }: HorizonTableProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const teamMap = new Map(teams.map((t) => [t.id, t.short_name]));

  // Compute projected score per player per GW
  const rows = picks.map((pick) => {
    const player = playerMap.get(pick.element);
    if (!player) return null;

    const gwScores = gwRange.map((gw) => {
      const singleGW = [gw];
      return {
        gw,
        score: scorePlayer(player, fixtures, singleGW).score,
        fixture: getUpcomingFixtures(player.team, fixtures, singleGW)[0],
      };
    });

    const totalScore = gwScores.reduce((s, g) => s + g.score, 0);

    return { pick, player, gwScores, totalScore };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  // Sort: starters first, then bench; within each group sort by total projected desc
  rows.sort((a, b) => {
    const aStarter = a.pick.position <= 11 ? 0 : 1;
    const bStarter = b.pick.position <= 11 ? 0 : 1;
    if (aStarter !== bStarter) return aStarter - bStarter;
    return b.totalScore - a.totalScore;
  });

  const maxScore = Math.max(...rows.map((r) => r.totalScore), 1);

  function scoreColor(score: number): string {
    const norm = score / (maxScore / gwRange.length);
    if (norm >= 0.75) return "text-fpl-green bg-fpl-green/10";
    if (norm >= 0.5) return "text-fpl-cyan bg-fpl-cyan/10";
    if (norm >= 0.25) return "text-fpl-text-primary";
    return "text-fpl-text-secondary";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-fpl-border">
            <th className="text-left py-2 px-3 text-fpl-text-secondary font-medium w-40">Player</th>
            <th className="text-left py-2 px-2 text-fpl-text-secondary font-medium">Pos</th>
            {gwRange.map((gw) => (
              <th key={gw} className="text-center py-2 px-2 text-fpl-text-secondary font-medium">GW{gw}</th>
            ))}
            <th className="text-center py-2 px-3 text-fpl-text-secondary font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ pick, player, gwScores, totalScore }, idx) => {
            const isBench = pick.position > 11;
            return (
              <tr
                key={pick.element}
                className={cn(
                  "border-b border-fpl-border/50 hover:bg-fpl-panel transition-colors",
                  isBench && "opacity-60"
                )}
              >
                {/* Player */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={player.status} />
                    <span className={cn("font-medium", isBench ? "text-fpl-text-secondary" : "text-fpl-text-primary")}>
                      {player.web_name}
                    </span>
                    {isBench && <span className="text-[9px] text-fpl-text-secondary">(bench)</span>}
                  </div>
                  <div className="text-[10px] text-fpl-text-secondary mt-0.5">
                    {teamMap.get(player.team) ?? "?"}
                  </div>
                </td>
                {/* Position */}
                <td className="py-2 px-2 text-fpl-text-secondary">
                  {POSITION_NAMES[player.element_type]}
                </td>
                {/* Per-GW scores */}
                {gwScores.map(({ gw, score, fixture }) => {
                  const opp = fixture ? (teamMap.get(fixture.opponentId) ?? "?") : null;
                  return (
                    <td key={gw} className="py-2 px-2 text-center">
                      <div className={cn("font-bold rounded px-1", scoreColor(score))}>
                        {score.toFixed(1)}
                      </div>
                      {fixture && (
                        <DifficultyBadge
                          difficulty={fixture.difficulty}
                          teamName={opp ?? undefined}
                          isHome={fixture.isHome}
                          className="mt-0.5"
                        />
                      )}
                    </td>
                  );
                })}
                {/* Total */}
                <td className="py-2 px-3 text-center">
                  <span className="font-bold text-fpl-purple-light">{totalScore.toFixed(1)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
