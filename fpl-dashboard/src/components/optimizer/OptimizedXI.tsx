"use client";

import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { useOptimizer } from "@/hooks/useOptimizer";
import { PlayerCard } from "@/components/team/PlayerCard";
import { BenchRow } from "./BenchRow";
import { FormationBadge } from "./FormationBadge";
import { Spinner } from "@/components/shared/Spinner";
import { PlayerCardSkeleton } from "@/components/shared/Skeleton";
import { POSITION_IDS } from "@/lib/utils/constants";
import { scorePlayer } from "@/lib/engine/projected-points";
import { cn } from "@/lib/utils/cn";

export function OptimizedXI() {
  const { picks, bootstrap, fixtures, gwRange, isLoading, setSelectedPlayerId } = useFPL();
  const optimized = useOptimizer(picks?.picks, bootstrap?.elements, fixtures, gwRange);

  if (isLoading && !picks) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!picks || !bootstrap || !optimized) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-fpl-text-secondary">
        <Spinner />
        <p className="text-sm">Calculating optimal lineup…</p>
      </div>
    );
  }

  const playerMap = new Map(bootstrap.elements.map((p) => [p.id, p]));
  const pickMap = new Map(picks.picks.map((p) => [p.element, p]));

  // Group starters by position for pitch layout
  const gks = optimized.starters.filter(
    (id) => playerMap.get(id)?.element_type === POSITION_IDS.GKP
  );
  const defs = optimized.starters.filter(
    (id) => playerMap.get(id)?.element_type === POSITION_IDS.DEF
  );
  const mids = optimized.starters.filter(
    (id) => playerMap.get(id)?.element_type === POSITION_IDS.MID
  );
  const fwds = optimized.starters.filter(
    (id) => playerMap.get(id)?.element_type === POSITION_IDS.FWD
  );

  const rows = [gks, defs, mids, fwds];

  const gainPositive = optimized.projectedGainVsCurrent >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-fpl-text-primary flex items-center gap-2">
            <Zap className="h-4 w-4 text-fpl-purple" />
            Optimized Starting XI
          </h2>
          <p className="text-xs text-fpl-text-secondary mt-0.5">
            Best lineup from your current squad for the selected horizon
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {optimized.currentFormation && (
            <FormationBadge formation={optimized.currentFormation} isCurrent />
          )}
          <span className="text-fpl-text-secondary text-xs">→</span>
          <FormationBadge formation={optimized.formation} isRecommended />
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-bold border",
              gainPositive
                ? "bg-fpl-green/15 text-fpl-green border-fpl-green/30"
                : "bg-fpl-red/15 text-fpl-red border-fpl-red/30"
            )}
          >
            {gainPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {gainPositive ? "+" : ""}
            {optimized.projectedGainVsCurrent.toFixed(1)} pts
          </div>
        </div>
      </div>

      {/* Pitch visualization */}
      <div className="relative overflow-hidden rounded-2xl border border-fpl-border bg-gradient-to-b from-emerald-950/30 to-emerald-900/10 p-4">
        {/* Pitch markings */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-4 right-4 h-px bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full border border-white" />
        </div>

        <div className="relative space-y-4">
          {rows.map((rowIds, rowIdx) => {
            if (rowIds.length === 0) return null;
            return (
              <div
                key={rowIdx}
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${rowIds.length}, minmax(0, 1fr))` }}
              >
                {rowIds.map((playerId) => {
                  const player = playerMap.get(playerId);
                  const pick = pickMap.get(playerId);
                  if (!player) return null;

                  const isCaptain = optimized.captain === playerId;
                  const isVice = optimized.viceCaptain === playerId;

                  const projected = fixtures
                    ? scorePlayer(player, fixtures, gwRange).score
                    : undefined;

                  return (
                    <PlayerCard
                      key={playerId}
                      player={player}
                      pick={pick}
                      projectedScore={projected}
                      highlight={isCaptain ? "captain" : isVice ? "vice" : "start"}
                      compact
                      onClick={() => setSelectedPlayerId(player.id)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bench */}
      <BenchRow benchPlayerIds={optimized.bench} picks={picks.picks} />

      {/* Captain note */}
      <div className="rounded-xl border border-fpl-border bg-fpl-panel p-3 text-xs text-fpl-text-secondary space-y-1">
        {(() => {
          const cap = playerMap.get(optimized.captain);
          const vc = playerMap.get(optimized.viceCaptain);
          return (
            <>
              <p>
                <span className="text-yellow-400 font-semibold">C Captain:</span>{" "}
                <span className="text-fpl-text-primary font-medium">{cap?.web_name ?? "?"}</span>
                {" — "}highest projected score this week
              </p>
              <p>
                <span className="text-yellow-600 font-semibold">V Vice:</span>{" "}
                <span className="text-fpl-text-primary font-medium">{vc?.web_name ?? "?"}</span>
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
