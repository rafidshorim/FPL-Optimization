"use client";

import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fpl-client";
import { SWR_KEYS } from "@/lib/api/swr-keys";
import type { BootstrapStatic } from "@/types/fpl";

export function useBootstrap() {
  return useSWR<BootstrapStatic>(SWR_KEYS.bootstrap(), fetchJSON, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000, // 5 min
  });
}
