export type TabId = "overview" | "optimizer" | "transfers" | "planner";
export type HorizonGW = 1 | 3 | 5;

export interface AppState {
  teamId: string | null;
  isDemoMode: boolean;
  activeTab: TabId;
  horizonGW: HorizonGW;
  selectedPlayerId: number | null;
}

export interface PlayerCardBadge {
  label: string;
  variant: "buy" | "sell" | "start" | "bench" | "risk" | "hot" | "captain" | "vice";
}
