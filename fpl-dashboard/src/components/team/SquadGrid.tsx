"use client";

import { useFPL } from "@/context/FPLContext";
import { PitchPlayerCard } from "@/components/shared/PitchPlayerCard";
import { Spinner } from "@/components/shared/Spinner";
import { useOptimizer } from "@/hooks/useOptimizer";
import { POSITION_IDS } from "@/lib/utils/constants";
import { Pitch } from "@/components/shared/Pitch";

export function SquadGrid() {
  const { picks, bootstrap, fixtures, gwRange, isLoading, setSelectedPlayerId } = useFPL();
  const optimizer = useOptimizer(picks?.picks, bootstrap?.elements, fixtures, gwRange);

  if (isLoading && !picks) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!picks || !bootstrap) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const playerMap = new Map(bootstrap.elements.map((p) => [p.id, p]));
  const starterIds = new Set(optimizer?.starters ?? []);
  const benchIds = new Set(optimizer?.bench ?? []);

  // Separate starters and bench from picks (by pick position, not optimizer)
  const starterPicks = picks.picks.filter((p) => p.position <= 11);
  const benchPicks = picks.picks.filter((p) => p.position > 11);

  // Group starters by FPL position
  const gks = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.GKP);
  const defs = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.DEF);
  const mids = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.MID);
  const fwds = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.FWD);

  function renderPick(pickEl: number, isCaptain: boolean, isVice: boolean) {
    const player = playerMap.get(pickEl);
    if (!player) return null;
    const pick = picks!.picks.find((p) => p.element === pickEl);
    const isOptimizedBench = benchIds.has(pickEl) && pick?.position !== undefined && pick.position <= 11;
    const isOptimizedStart = starterIds.has(pickEl) && pick?.position !== undefined && pick.position > 11;
    return (
      <PitchPlayerCard
        key={pickEl}
        player={player}
        pick={pick}
        fixtures={fixtures}
        gwRange={gwRange}
        teams={bootstrap!.teams}
        teamShortName={bootstrap!.teams.find((t) => t.id === player.team)?.short_name}
        isCaptain={isCaptain}
        isViceCaptain={isVice}
        optimizerHighlight={isOptimizedBench ? "bench" : isOptimizedStart ? "start" : null}
        onClick={() => setSelectedPlayerId(player.id)}
      />
    );
  }

  const captain = picks.picks.find((p) => p.is_captain)?.element ?? -1;
  const vice = picks.picks.find((p) => p.is_vice_captain)?.element ?? -1;

  const rows = [
    gks.map((p) => p.element),
    defs.map((p) => p.element),
    mids.map((p) => p.element),
    fwds.map((p) => p.element),
  ];

  // Bench labels per FPL convention
  const benchLabels = ["GKP", "1. MID", "2. DEF", "3. DEF"];

  return (
    <div className="space-y-0">
      <Pitch
        rows={rows}
        renderPlayer={(id: number) => renderPick(id, id === captain, id === vice)}
      />

      {/* Bench */}
      <div className="rounded-b-2xl bg-[#1a1a2e]/80 border border-t-0 border-fpl-border px-4 py-4">
        <p className="text-center text-xs font-bold text-fpl-text-secondary uppercase tracking-widest mb-3">
          Substitutes
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          {benchPicks.map((pick, i) => {
            const player = playerMap.get(pick.element);
            if (!player) return null;
            return (
              <div key={pick.element} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-fpl-text-secondary uppercase tracking-wider">
                  {benchLabels[i] ?? `${i + 1}`}
                </span>
                <PitchPlayerCard
                  player={player}
                  pick={pick}
                  fixtures={fixtures}
                  gwRange={gwRange}
                  teams={bootstrap.teams}
                  teamShortName={bootstrap.teams.find((t) => t.id === player.team)?.short_name}
                  optimizerHighlight={starterIds.has(pick.element) ? "start" : null}
                  onClick={() => setSelectedPlayerId(player.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimizer nudge */}
      {optimizer && Math.abs(optimizer.projectedGainVsCurrent) > 0.1 && (
        <div className="mt-3 rounded-xl border border-fpl-purple/30 bg-fpl-purple/10 px-4 py-3">
          <p className="text-xs text-fpl-text-secondary">
            <span className="font-semibold text-fpl-purple-light">Optimizer tip:</span>{" "}
            A <span className="font-semibold text-white">{optimizer.formation}</span> formation
            could gain{" "}
            <span className="font-semibold text-fpl-green">
              +{optimizer.projectedGainVsCurrent.toFixed(1)} pts
            </span>
            . See the <span className="text-fpl-purple-light">Optimizer</span> tab.
          </p>
        </div>
      )}
    </div>
  );
}
