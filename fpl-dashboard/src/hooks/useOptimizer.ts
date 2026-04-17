"use client";

import { useMemo } from "react";
import type { Player, Pick, Fixture } from "@/types/fpl";
import type { OptimizedXI } from "@/types/engine";
import { optimizeXI } from "@/lib/engine/lineup-optimizer";

export function useOptimizer(
  picks: Pick[] | undefined,
  allPlayers: Player[] | undefined,
  fixtures: Fixture[] | undefined,
  gwRange: number[]
): OptimizedXI | null {
  return useMemo(() => {
    if (!picks || !allPlayers || !fixtures || picks.length < 15) return null;
    try {
      return optimizeXI(picks, allPlayers, fixtures, gwRange);
    } catch {
      return null;
    }
  }, [picks, allPlayers, fixtures, gwRange]);
}
