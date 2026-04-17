"use client";

import dynamic from "next/dynamic";
import { X, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useFPL } from "@/context/FPLContext";
import { usePlayerSummary } from "@/hooks/usePlayerSummary";
import { FixtureList } from "./FixtureList";
import { StatusDot } from "@/components/shared/StatusDot";
import { StatPill } from "@/components/shared/StatPill";
import { Spinner } from "@/components/shared/Spinner";
import { POSITION_NAMES } from "@/lib/utils/constants";
import { formatPrice, formatPercent } from "@/lib/utils/formatters";

// Chart components require window — must not SSR
const PlayerHistoryChart = dynamic(
  () => import("./PlayerHistoryChart").then((m) => m.PlayerHistoryChart),
  { ssr: false, loading: () => <div className="h-44 flex items-center justify-center"><Spinner /></div> }
);

const ICTRadar = dynamic(
  () => import("./ICTRadar").then((m) => m.ICTRadar),
  { ssr: false, loading: () => <div className="h-44 flex items-center justify-center"><Spinner /></div> }
);

export function PlayerModal() {
  const { selectedPlayerId, setSelectedPlayerId, bootstrap } = useFPL();
  const { data: summary, isLoading } = usePlayerSummary(selectedPlayerId);

  if (!selectedPlayerId) return null;

  const player = bootstrap?.elements.find((p) => p.id === selectedPlayerId);
  if (!player) return null;

  const team = bootstrap?.teams.find((t) => t.id === player.team);
  const posName = POSITION_NAMES[player.element_type] ?? "?";
  const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setSelectedPlayerId(null)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-fpl-panel shadow-2xl shadow-black/50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-fpl-border bg-fpl-panel/95 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-fpl-card">
              <Image
                src={photoUrl}
                alt={player.web_name}
                fill
                className="object-cover object-top"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-fpl-text-primary">
                  {player.first_name} {player.second_name}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusDot status={player.status} showLabel />
                <span className="text-xs text-fpl-text-secondary">{team?.name} · {posName}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm font-bold text-fpl-text-primary">{formatPrice(player.now_cost)}</span>
                {player.cost_change_event !== 0 && (
                  <span className={`text-[10px] font-semibold ${player.cost_change_event > 0 ? "text-fpl-green" : "text-fpl-red"}`}>
                    {player.cost_change_event > 0 ? "▲" : "▼"}{formatPrice(Math.abs(player.cost_change_event))}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedPlayerId(null)}
            className="rounded-lg p-1.5 text-fpl-text-secondary hover:bg-fpl-card hover:text-fpl-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 space-y-5">
          {/* Key stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Pts", value: player.total_points, variant: "purple" as const },
              { label: "Form", value: parseFloat(player.form).toFixed(1), variant: parseFloat(player.form) >= 5 ? "positive" as const : "default" as const },
              { label: "PPG", value: parseFloat(player.points_per_game).toFixed(1), variant: "default" as const },
              { label: "Selected", value: formatPercent(player.selected_by_percent), variant: "default" as const },
              { label: "EP Next", value: parseFloat(player.ep_next).toFixed(1), variant: parseFloat(player.ep_next) >= 5 ? "positive" as const : "default" as const },
              { label: "ICT Rank", value: `#${player.ict_index_rank}`, variant: player.ict_index_rank <= 20 ? "positive" as const : "default" as const },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-fpl-border bg-fpl-card p-2.5">
                <div className="text-[10px] text-fpl-text-secondary">{s.label}</div>
                <div className="text-sm font-bold text-fpl-text-primary mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Season stats */}
          <div>
            <h3 className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest mb-2">Season Stats</h3>
            <div className="flex flex-wrap gap-1.5">
              <StatPill label="G" value={player.goals_scored} variant={player.goals_scored > 5 ? "positive" : "default"} />
              <StatPill label="A" value={player.assists} variant={player.assists > 5 ? "positive" : "default"} />
              <StatPill label="CS" value={player.clean_sheets} />
              <StatPill label="BPS" value={player.bps} />
              <StatPill label="Min" value={player.minutes} />
              <StatPill label="Starts" value={player.starts} />
              <StatPill label="xG" value={parseFloat(player.expected_goals).toFixed(1)} />
              <StatPill label="xA" value={parseFloat(player.expected_assists).toFixed(1)} />
              <StatPill label="xGI/90" value={player.expected_goal_involvements_per_90.toFixed(2)} variant="purple" />
            </div>
          </div>

          {/* News */}
          {player.news && (
            <div className="rounded-xl border border-fpl-amber/30 bg-fpl-amber/10 px-3 py-2">
              <p className="text-xs text-fpl-amber">{player.news}</p>
            </div>
          )}

          {/* Points history chart */}
          <div>
            <h3 className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest mb-3">
              Points History (last 10 GWs)
            </h3>
            {isLoading ? (
              <div className="h-44 flex items-center justify-center">
                <Spinner />
              </div>
            ) : summary?.history && summary.history.length > 0 ? (
              <PlayerHistoryChart history={summary.history} />
            ) : (
              <p className="text-xs text-fpl-text-secondary">No history available yet.</p>
            )}
          </div>

          {/* ICT Radar */}
          <div>
            <h3 className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest mb-3">
              Attacking Profile
            </h3>
            <ICTRadar player={player} />
          </div>

          {/* Upcoming fixtures */}
          <div>
            <h3 className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest mb-2">
              Upcoming Fixtures
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : summary?.fixtures ? (
              <FixtureList fixtures={summary.fixtures} maxItems={5} />
            ) : null}
          </div>

          {/* Past seasons */}
          {summary?.history_past && summary.history_past.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-fpl-text-secondary uppercase tracking-widest mb-2">
                Previous Seasons
              </h3>
              <div className="space-y-1.5">
                {summary.history_past.slice(-3).reverse().map((s) => (
                  <div key={s.season_name} className="flex items-center justify-between rounded-lg border border-fpl-border bg-fpl-panel px-3 py-2 text-xs">
                    <span className="text-fpl-text-secondary">{s.season_name}</span>
                    <span className="font-bold text-fpl-text-primary">{s.total_points} pts</span>
                    <span className="text-fpl-text-secondary">{s.goals_scored}G {s.assists}A</span>
                    <span className="text-fpl-text-secondary">{s.minutes}&apos;</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
