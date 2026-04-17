"use client";

import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fpl-client";
import { SWR_KEYS } from "@/lib/api/swr-keys";
import type { PlayerSummary } from "@/types/fpl";

export function usePlayerSummary(playerId: number | null) {
  return useSWR<PlayerSummary>(
    playerId ? SWR_KEYS.player(playerId) : null,
    fetchJSON,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120_000,
    }
  );
}
