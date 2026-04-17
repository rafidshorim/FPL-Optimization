"use client";

import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fpl-client";
import { SWR_KEYS } from "@/lib/api/swr-keys";
import type { PicksResponse } from "@/types/fpl";

export function useTeamPicks(teamId: string | null, gw: number | null) {
  const key = teamId && gw ? SWR_KEYS.picks(teamId, gw) : null;

  return useSWR<PicksResponse>(key, fetchJSON, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      if ((error as { status?: number }).status === 404) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });
}
