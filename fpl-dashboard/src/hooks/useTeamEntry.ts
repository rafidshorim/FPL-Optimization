"use client";

import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fpl-client";
import { SWR_KEYS } from "@/lib/api/swr-keys";
import type { EntryResponse } from "@/types/fpl";

export function useTeamEntry(teamId: string | null) {
  return useSWR<EntryResponse>(
    teamId ? SWR_KEYS.entry(teamId) : null,
    fetchJSON,
    {
      revalidateOnFocus: false,
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        if ((error as { status?: number }).status === 404) return; // invalid team ID
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );
}
