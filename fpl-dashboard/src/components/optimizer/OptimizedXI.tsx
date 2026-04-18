"use client";

import { useState } from "react";
import Image from "next/image";
import { Zap, TrendingUp, TrendingDown, LayoutGrid, List } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { useOptimizer } from "@/hooks/useOptimizer";
import { FormationBadge } from "./FormationBadge";
import { Spinner } from "@/components/shared/Spinner";
import { PlayerCardSkeleton } from "@/components/shared/Skeleton";
import { Pitch } from "@/components/shared/Pitch";
import { PitchPlayerCard } from "@/components/shared/PitchPlayerCard";
import { POSITION_IDS, POSITION_NAMES } from "@/lib/utils/constants";
import { scorePlayer } from "@/lib/engine/projected-points";
import { getUpcomingFixtures } from "@/lib/engine/fixture-difficulty";
import { cn } from "@/lib/utils/cn";
import type { Player, Fixture } from "@/types/fpl";

type Team = { id: number; short_name: string };

function positionBadgeClass(elementType: number): string {
  if (elementType === 1) return "bg-amber-400/20 text-amber-300 border-amber-400/30";
  if (elementType === 2) return "bg-sky-400/20 text-sky-300 border-sky-400/30";
  if (elementType === 3) return "bg-emerald-400/20 text-emerald-300 border-emerald-400/30";
  return "bg-rose-400/20 text-rose-300 border-rose-400/30";
}

function statusDotClass(status: string): string {
  if (status === "a") return "bg-green-400";
  if (status === "d") return "bg-yellow-400";
  return "bg-red-500";
}

interface OptListRowProps {
  player: Player;
  fixtures: Fixture[];
  gwRange: number[];
  teams: Team[];
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  projectedScore?: number;
  subPriority?: number;
  onClick?: () => void;
}

function OptListRow({ player, fixtures, gwRange, teams, isCaptain, isViceCaptain, projectedScore, subPriority, onClick }: OptListRowProps) {
  const posName = POSITION_NAMES[player.element_type] ?? "???";
  const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`;
  const teamName = teams.find((t) => t.id === player.team)?.short_name ?? "?";

  const upcoming = gwRange.length > 0 ? getUpcomingFixtures(player.team, fixtures, [gwRange[0]]) : [];
  const fix = upcoming[0];
  const opp = fix ? teams.find((t) => t.id === fix.opponentId) : undefined;
  const fixtureLabel = fix ? `${opp?.short_name ?? "?"} (${fix.isHome ? "H" : "A"})` : "";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-fpl-card hover:bg-fpl-panel border border-fpl-border transition-colors text-left"
    >
      {subPriority !== undefined && (
        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-fpl-panel border border-fpl-border text-[10px] font-bold text-fpl-text-secondary">
          {subPriority}
        </span>
      )}
      <span className={cn("shrink-0 w-9 text-center text-[10px] font-bold uppercase rounded px-1 py-0.5 border", positionBadgeClass(player.element_type))}>
        {posName}
      </span>
      <div className="relative h-9 w-7 rounded overflow-hidden bg-fpl-panel shrink-0">
        <Image
          src={photoUrl}
          alt={player.web_name}
          fill
          className="object-cover object-top"
          unoptimized
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fpl-text-primary truncate">{player.web_name}</p>
        <p className="text-[10px] text-fpl-text-secondary">{teamName}</p>
      </div>
      {fixtureLabel && (
        <span className="text-[10px] text-fpl-text-secondary shrink-0 hidden sm:block">{fixtureLabel}</span>
      )}
      {projectedScore !== undefined && (
        <span className="text-[11px] font-bold text-fpl-purple-light shrink-0">~{projectedScore.toFixed(1)}</span>
      )}
      {isCaptain && (
        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 text-[9px] font-black text-white">C</span>
      )}
      {isViceCaptain && !isCaptain && (
        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-black text-gray-800">V</span>
      )}
      <span className={cn("shrink-0 h-2.5 w-2.5 rounded-full border border-white/20", statusDotClass(player.status))} />
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1 px-1">
      <span className="text-[10px] font-bold text-fpl-text-secondary uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-fpl-border/60" />
    </div>
  );
}

export function OptimizedXI() {
  const { picks, bootstrap, fixtures, gwRange, isLoading, setSelectedPlayerId } = useFPL();
  const optimized = useOptimizer(picks?.picks, bootstrap?.elements, fixtures, gwRange);
  const [viewMode, setViewMode] = useState<"pitch" | "list">("pitch");

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

  const gks = optimized.starters.filter((id) => playerMap.get(id)?.element_type === POSITION_IDS.GKP);
  const defs = optimized.starters.filter((id) => playerMap.get(id)?.element_type === POSITION_IDS.DEF);
  const mids = optimized.starters.filter((id) => playerMap.get(id)?.element_type === POSITION_IDS.MID);
  const fwds = optimized.starters.filter((id) => playerMap.get(id)?.element_type === POSITION_IDS.FWD);

  const rows = [gks, defs, mids, fwds];

  const positionGroups = [
    { label: "Goalkeepers", ids: gks },
    { label: "Defenders", ids: defs },
    { label: "Midfielders", ids: mids },
    { label: "Forwards", ids: fwds },
  ];

  const gainPositive = optimized.projectedGainVsCurrent >= 0;

  function renderOptimizedPlayer(id: number) {
    const player = playerMap.get(id);
    const pick = pickMap.get(id);
    if (!player) return null;
    return (
      <PitchPlayerCard
        key={id}
        player={player}
        pick={pick}
        fixtures={fixtures}
        gwRange={gwRange}
        teams={bootstrap!.teams}
        teamShortName={bootstrap!.teams.find((t) => t.id === player.team)?.short_name}
        isCaptain={optimized!.captain === id}
        isViceCaptain={optimized!.viceCaptain === id}
        optimizerHighlight="start"
        onClick={() => setSelectedPlayerId(player.id)}
      />
    );
  }

  const ViewToggle = (
    <div className="flex items-center gap-1 rounded-lg bg-fpl-panel border border-fpl-border p-0.5">
      <button
        onClick={() => setViewMode("pitch")}
        className={cn("p-1.5 rounded transition-colors", viewMode === "pitch" ? "bg-fpl-purple text-white" : "text-fpl-text-secondary hover:text-fpl-text-primary")}
        title="Pitch view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={cn("p-1.5 rounded transition-colors", viewMode === "list" ? "bg-fpl-purple text-white" : "text-fpl-text-secondary hover:text-fpl-text-primary")}
        title="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );

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
            {gainPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {gainPositive ? "+" : ""}
            {optimized.projectedGainVsCurrent.toFixed(1)} pts
          </div>
          {ViewToggle}
        </div>
      </div>

      {viewMode === "pitch" ? (
        <>
          {/* Pitch view using same Pitch component as Squad */}
          <div className="space-y-0">
            <Pitch rows={rows} renderPlayer={renderOptimizedPlayer} />
            {/* Bench */}
            <div className="rounded-b-2xl bg-[#1a1a2e]/80 border border-t-0 border-fpl-border px-4 py-4">
              <p className="text-center text-xs font-bold text-fpl-text-secondary uppercase tracking-widest mb-3">
                Bench
              </p>
              <div className="flex justify-center gap-5 flex-wrap">
                {optimized.bench.map((id, idx) => {
                  const player = playerMap.get(id);
                  const pick = pickMap.get(id);
                  if (!player) return null;
                  return (
                    <div key={id} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-fpl-text-secondary uppercase tracking-wider">
                        {idx + 1}
                      </span>
                      <PitchPlayerCard
                        player={player}
                        pick={pick}
                        fixtures={fixtures}
                        gwRange={gwRange}
                        teams={bootstrap.teams}
                        teamShortName={bootstrap.teams.find((t) => t.id === player.team)?.short_name}
                        optimizerHighlight="bench"
                        onClick={() => setSelectedPlayerId(player.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-fpl-border overflow-hidden bg-fpl-card/30">
          {/* Starting XI */}
          <div className="bg-fpl-panel/60 px-4 py-2.5 border-b border-fpl-border">
            <p className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest">Starting XI</p>
          </div>
          <div className="px-3 pb-2">
            {positionGroups.map((group) =>
              group.ids.length > 0 ? (
                <div key={group.label}>
                  <SectionHeader label={group.label} />
                  <div className="space-y-1.5">
                    {group.ids.map((id) => {
                      const player = playerMap.get(id);
                      if (!player) return null;
                      const projected = fixtures ? scorePlayer(player, fixtures, gwRange).score : undefined;
                      return (
                        <OptListRow
                          key={id}
                          player={player}
                          fixtures={fixtures ?? []}
                          gwRange={gwRange ?? []}
                          teams={bootstrap.teams}
                          isCaptain={optimized.captain === id}
                          isViceCaptain={optimized.viceCaptain === id}
                          projectedScore={projected}
                          onClick={() => setSelectedPlayerId(player.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>

          {/* Bench */}
          <div className="bg-fpl-panel/60 px-4 py-2.5 border-t border-fpl-border">
            <p className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest">Bench</p>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {optimized.bench.map((id, idx) => {
              const player = playerMap.get(id);
              if (!player) return null;
              const projected = fixtures ? scorePlayer(player, fixtures, gwRange).score : undefined;
              return (
                <OptListRow
                  key={id}
                  player={player}
                  fixtures={fixtures ?? []}
                  gwRange={gwRange ?? []}
                  teams={bootstrap.teams}
                  projectedScore={projected}
                  subPriority={idx + 1}
                  onClick={() => setSelectedPlayerId(player.id)}
                />
              );
            })}
          </div>
        </div>
      )}

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
