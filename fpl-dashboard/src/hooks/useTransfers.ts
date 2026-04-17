"use client";

import { useMemo } from "react";
import type { Player, Pick, Fixture, PicksResponse } from "@/types/fpl";
import type { TransferPair } from "@/types/engine";
import { rankTransfers, computeSquadTeamCounts } from "@/lib/engine/transfer-engine";

export function useTransfers(
  picksResponse: PicksResponse | undefined,
  allPlayers: Player[] | undefined,
  fixtures: Fixture[] | undefined,
  gwRange: number[]
): TransferPair[] {
  return useMemo(() => {
    if (!picksResponse || !allPlayers || !fixtures) return [];

    const picks: Pick[] = picksResponse.picks;
    const bank = picksResponse.entry_history.bank;
    const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
    const squadIds = new Set(picks.map((p) => p.element));
    const teamCounts = computeSquadTeamCounts(picks, playerMap);

    try {
      return rankTransfers(picks, squadIds, allPlayers, fixtures, gwRange, {
        bank,
        squadTeamCounts: teamCounts,
        teamLimit: 3,
      });
    } catch {
      return [];
    }
  }, [picksResponse, allPlayers, fixtures, gwRange]);
}
