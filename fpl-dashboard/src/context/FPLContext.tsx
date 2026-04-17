"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fpl-client";
import { SWR_KEYS } from "@/lib/api/swr-keys";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useTeamEntry } from "@/hooks/useTeamEntry";
import { useTeamPicks } from "@/hooks/useTeamPicks";
import type { BootstrapStatic, Fixture, EntryResponse, PicksResponse } from "@/types/fpl";
import type { TabId, HorizonGW } from "@/types/ui";

interface DemoPayload {
  bootstrap: BootstrapStatic;
  fixtures: Fixture[];
  picks: PicksResponse;
  entry: EntryResponse;
  currentGW: number;
}

interface FPLContextValue {
  // App state
  teamId: string | null;
  setTeamId: (id: string | null) => void;
  isDemoMode: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  horizonGW: HorizonGW;
  setHorizonGW: (gw: HorizonGW) => void;
  selectedPlayerId: number | null;
  setSelectedPlayerId: (id: number | null) => void;

  // Data
  bootstrap: BootstrapStatic | undefined;
  fixtures: Fixture[] | undefined;
  entry: EntryResponse | undefined;
  picks: PicksResponse | undefined;

  // Derived
  currentGW: number;
  gwRange: number[];

  // Status
  isLoading: boolean;
  error: string | null;
  mutateEntry: () => void;
  mutatePicks: () => void;
}

const FPLContext = createContext<FPLContextValue | null>(null);

export function FPLProvider({ children }: { children: React.ReactNode }) {
  const [teamId, setTeamIdRaw] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [horizonGW, setHorizonGW] = useState<HorizonGW>(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const isDemoMode = teamId === null;

  // Hydrate teamId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("fpl_team_id");
    if (stored) setTeamIdRaw(stored);
  }, []);

  const setTeamId = useCallback((id: string | null) => {
    setTeamIdRaw(id);
    if (id) {
      localStorage.setItem("fpl_team_id", id);
    } else {
      localStorage.removeItem("fpl_team_id");
    }
  }, []);

  // --- Real data (when teamId is set) ---
  const { data: bootstrap, isLoading: bootstrapLoading, error: bootstrapError } = useBootstrap();
  const { data: fixtureData, isLoading: fixturesLoading } = useSWR<Fixture[]>(
    SWR_KEYS.fixtures(),
    fetchJSON,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const { data: entry, error: entryError, mutate: mutateEntry } = useTeamEntry(isDemoMode ? null : teamId);

  // Determine current GW from bootstrap
  const currentGW = useMemo(() => {
    if (bootstrap?.events) {
      const current = bootstrap.events.find((e) => e.is_current);
      if (current) return current.id;
      const next = bootstrap.events.find((e) => e.is_next);
      if (next) return next.id - 1;
    }
    return 1;
  }, [bootstrap]);

  const { data: picks, error: picksError, mutate: mutatePicks } = useTeamPicks(
    isDemoMode ? null : teamId,
    isDemoMode ? null : currentGW
  );

  // --- Demo data (when no teamId) ---
  const { data: demoData, isLoading: demoLoading } = useSWR<DemoPayload>(
    isDemoMode ? SWR_KEYS.demo() : null,
    fetchJSON,
    { revalidateOnFocus: false, dedupingInterval: 86_400_000 }
  );

  // Merge real vs demo data
  const effectiveBootstrap = isDemoMode
    ? (demoData?.bootstrap as unknown as BootstrapStatic | undefined)
    : bootstrap;
  const effectiveFixtures = isDemoMode ? demoData?.fixtures : fixtureData;
  const effectiveEntry = isDemoMode ? demoData?.entry : entry;
  const effectivePicks = isDemoMode ? demoData?.picks : picks;
  const effectiveGW = isDemoMode ? (demoData?.currentGW ?? 35) : currentGW;

  // GW range for the selected horizon
  const gwRange = useMemo(() => {
    const range: number[] = [];
    for (let i = 0; i < horizonGW; i++) {
      range.push(effectiveGW + i);
    }
    return range;
  }, [effectiveGW, horizonGW]);

  const isLoading =
    (isDemoMode ? demoLoading : bootstrapLoading || fixturesLoading) ||
    (!isDemoMode && teamId !== null && !effectivePicks);

  const error = useMemo(() => {
    if (bootstrapError) return "FPL API is currently unavailable. Please try again later.";
    const anyErr = entryError ?? picksError;
    if (!anyErr) return null;
    const status = (anyErr as { status?: number }).status;
    if (status === 404) return "Team ID not found. Check your FPL team ID and try again.";
    return "Unable to load your team data. Please retry.";
  }, [bootstrapError, entryError, picksError]);

  const value: FPLContextValue = {
    teamId,
    setTeamId,
    isDemoMode,
    activeTab,
    setActiveTab,
    horizonGW,
    setHorizonGW,
    selectedPlayerId,
    setSelectedPlayerId,
    bootstrap: effectiveBootstrap,
    fixtures: effectiveFixtures,
    entry: effectiveEntry,
    picks: effectivePicks,
    currentGW: effectiveGW,
    gwRange,
    isLoading,
    error,
    mutateEntry: () => mutateEntry(),
    mutatePicks: () => mutatePicks(),
  };

  return <FPLContext.Provider value={value}>{children}</FPLContext.Provider>;
}

export function useFPL(): FPLContextValue {
  const ctx = useContext(FPLContext);
  if (!ctx) throw new Error("useFPL must be used within FPLProvider");
  return ctx;
}
