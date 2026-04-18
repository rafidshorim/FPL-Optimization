"use client";

import { useState } from "react";
import Image from "next/image";
import { LayoutGrid, List } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { PitchPlayerCard } from "@/components/shared/PitchPlayerCard";
import { Spinner } from "@/components/shared/Spinner";
import { useOptimizer } from "@/hooks/useOptimizer";
import { POSITION_IDS, POSITION_NAMES } from "@/lib/utils/constants";
import { Pitch } from "@/components/shared/Pitch";
import { getUpcomingFixtures } from "@/lib/engine/fixture-difficulty";
import { cn } from "@/lib/utils/cn";
import type { Player, Fixture } from "@/types/fpl";

type FPLPick = { element: number; position: number; is_captain: boolean; is_vice_captain: boolean };
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

interface ListRowProps {
  player: Player;
  pick?: FPLPick;
  fixtures: Fixture[];
  gwRange: number[];
  teams: Team[];
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  optimizerHighlight?: "start" | "bench" | null;
  subLabel?: string;
  onClick?: () => void;
}

function ListPlayerRow({ player, fixtures, gwRange, teams, isCaptain, isViceCaptain, optimizerHighlight, subLabel, onClick }: ListRowProps) {
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
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-fpl-card hover:bg-fpl-panel border transition-colors text-left",
        optimizerHighlight === "start"
          ? "border-green-400/40"
          : optimizerHighlight === "bench"
          ? "border-gray-500/40 opacity-75"
          : "border-fpl-border"
      )}
    >
      {subLabel && (
        <span className="shrink-0 text-[9px] font-bold text-fpl-text-secondary uppercase w-8 text-right pr-1">
          {subLabel}
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

export function SquadGrid() {
  const { picks, bootstrap, fixtures, gwRange, isLoading, setSelectedPlayerId } = useFPL();
  const optimizer = useOptimizer(picks?.picks, bootstrap?.elements, fixtures, gwRange);
  const [viewMode, setViewMode] = useState<"pitch" | "list">("pitch");

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

  const starterPicks = picks.picks.filter((p) => p.position <= 11);
  const benchPicks = picks.picks.filter((p) => p.position > 11);

  const gks = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.GKP);
  const defs = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.DEF);
  const mids = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.MID);
  const fwds = starterPicks.filter((p) => playerMap.get(p.element)?.element_type === POSITION_IDS.FWD);

  const captain = picks.picks.find((p) => p.is_captain)?.element ?? -1;
  const vice = picks.picks.find((p) => p.is_vice_captain)?.element ?? -1;

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

  const rows = [
    gks.map((p) => p.element),
    defs.map((p) => p.element),
    mids.map((p) => p.element),
    fwds.map((p) => p.element),
  ];

  const benchLabels = ["GKP", "1st", "2nd", "3rd"];

  const positionGroups = [
    { label: "Goalkeepers", picks: gks },
    { label: "Defenders", picks: defs },
    { label: "Midfielders", picks: mids },
    { label: "Forwards", picks: fwds },
  ];

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
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex justify-end">{ViewToggle}</div>

      {viewMode === "pitch" ? (
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
            <div className="flex justify-center gap-5 flex-wrap">
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
        </div>
      ) : (
        <div className="rounded-2xl border border-fpl-border overflow-hidden bg-fpl-card/30">
          {/* Starting XI */}
          <div className="bg-fpl-panel/60 px-4 py-2.5 border-b border-fpl-border">
            <p className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest">Starting XI</p>
          </div>
          <div className="px-3 pb-2">
            {positionGroups.map((group) =>
              group.picks.length > 0 ? (
                <div key={group.label}>
                  <SectionHeader label={group.label} />
                  <div className="space-y-1.5">
                    {group.picks.map((pick) => {
                      const player = playerMap.get(pick.element);
                      if (!player) return null;
                      const isOptimizedBench = benchIds.has(pick.element) && pick.position <= 11;
                      const isOptimizedStart = starterIds.has(pick.element) && pick.position > 11;
                      return (
                        <ListPlayerRow
                          key={pick.element}
                          player={player}
                          pick={pick}
                          fixtures={fixtures ?? []}
                          gwRange={gwRange ?? []}
                          teams={bootstrap.teams}
                          isCaptain={pick.element === captain}
                          isViceCaptain={pick.element === vice}
                          optimizerHighlight={isOptimizedBench ? "bench" : isOptimizedStart ? "start" : null}
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
            <p className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest">Substitutes</p>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {benchPicks.map((pick, i) => {
              const player = playerMap.get(pick.element);
              if (!player) return null;
              return (
                <ListPlayerRow
                  key={pick.element}
                  player={player}
                  pick={pick}
                  fixtures={fixtures ?? []}
                  gwRange={gwRange ?? []}
                  teams={bootstrap.teams}
                  subLabel={benchLabels[i] ?? `${i + 1}`}
                  optimizerHighlight={starterIds.has(pick.element) ? "start" : null}
                  onClick={() => setSelectedPlayerId(player.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Optimizer nudge */}
      {optimizer && Math.abs(optimizer.projectedGainVsCurrent) > 0.1 && (
        <div className="rounded-xl border border-fpl-purple/30 bg-fpl-purple/10 px-4 py-3">
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
