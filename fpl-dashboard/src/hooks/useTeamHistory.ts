"use client";

import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fpl-client";
import { SWR_KEYS } from "@/lib/api/swr-keys";
import type { TeamHistory } from "@/types/fpl";

export function useTeamHistory(teamId: string | null) {
  return useSWR<TeamHistory>(
    teamId ? SWR_KEYS.entryHistory(teamId) : null,
    fetchJSON,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
}
