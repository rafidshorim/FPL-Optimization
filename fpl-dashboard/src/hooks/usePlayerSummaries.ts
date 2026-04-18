"use client";

import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fpl-client";
import { SWR_KEYS } from "@/lib/api/swr-keys";
import type { PlayerSummary } from "@/types/fpl";

export function usePlayerSummaries(playerIds: number[]) {
  const sortedIds = [...playerIds].sort((a, b) => a - b);
  const cacheKey = sortedIds.length > 0 ? `summaries:${sortedIds.join(",")}` : null;

  return useSWR<Map<number, PlayerSummary>>(
    cacheKey,
    async () => {
      const results = await Promise.all(
        sortedIds.map((id) => fetchJSON<PlayerSummary>(SWR_KEYS.player(id)))
      );
      return new Map(sortedIds.map((id, i) => [id, results[i]]));
    },
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );
}
