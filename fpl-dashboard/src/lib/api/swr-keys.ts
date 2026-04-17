export const SWR_KEYS = {
  bootstrap: () => "/api/fpl/bootstrap",
  fixtures: () => "/api/fpl/fixtures",
  entry: (teamId: string) => `/api/fpl/entry/${teamId}`,
  entryHistory: (teamId: string) => `/api/fpl/entry/${teamId}/history`,
  picks: (teamId: string, gw: number) => `/api/fpl/entry/${teamId}/picks/${gw}`,
  player: (id: number) => `/api/fpl/player/${id}`,
  demo: () => "/api/fpl/demo",
} as const;
