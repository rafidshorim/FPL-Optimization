"use client";

import type { Player, Pick } from "@/types/fpl";
import { PlayerCard } from "@/components/team/PlayerCard";
import { useFPL } from "@/context/FPLContext";

interface BenchRowProps {
  benchPlayerIds: number[];
  picks: Pick[];
}

export function BenchRow({ benchPlayerIds, picks }: BenchRowProps) {
  const { bootstrap, fixtures, gwRange, setSelectedPlayerId } = useFPL();

  if (!bootstrap) return null;

  const playerMap = new Map(bootstrap.elements.map((p) => [p.id, p]));
  const pickMap = new Map(picks.map((p) => [p.element, p]));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest">
          Bench
        </span>
        <div className="flex-1 h-px bg-fpl-border" />
        <span className="text-[10px] text-fpl-text-secondary">Sub priority →</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {benchPlayerIds.map((playerId, idx) => {
          const player = playerMap.get(playerId);
          const pick = pickMap.get(playerId);
          if (!player) return null;
          return (
            <div key={playerId} className="relative">
              <div className="absolute -top-1.5 -left-1.5 z-10 h-5 w-5 flex items-center justify-center rounded-full bg-fpl-panel border border-fpl-border text-[10px] font-bold text-fpl-text-secondary">
                {idx + 1}
              </div>
              <PlayerCard
                player={player}
                pick={pick}
                compact
                highlight="bench"
                onClick={() => setSelectedPlayerId(player.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
