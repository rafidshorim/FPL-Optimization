"use client";

import { useMemo, useState } from "react";
import { BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { useOptimizer } from "@/hooks/useOptimizer";
import { useTeamHistory } from "@/hooks/useTeamHistory";
import { usePlayerSummaries } from "@/hooks/usePlayerSummaries";
import { findBestXI } from "@/lib/engine/best-xi";
import { cn } from "@/lib/utils/cn";
import type { EntryHistory, Player, PlayerSummary } from "@/types/fpl";

// ── OLS regression ─────────────────────────────────────────────────────────
function ols(pts: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = pts.length;
  if (n < 2) return { slope: 0, intercept: pts[0]?.y ?? 0 };
  const xBar = pts.reduce((s, p) => s + p.x, 0) / n;
  const yBar = pts.reduce((s, p) => s + p.y, 0) / n;
  const ssXX = pts.reduce((s, p) => s + (p.x - xBar) ** 2, 0);
  if (ssXX === 0) return { slope: 0, intercept: yBar };
  const ssXY = pts.reduce((s, p) => s + (p.x - xBar) * (p.y - yBar), 0);
  return { slope: ssXY / ssXX, intercept: yBar - (ssXY / ssXX) * xBar };
}

// ── Compute true best possible for a GW from player summaries ──────────────
function computeTrueBestPossible(
  gwNum: number,
  playerMap: Map<number, Player>,
  summaries: Map<number, PlayerSummary>
): number {
  const scores = Array.from(playerMap.entries()).map(([id, player]) => {
    const summary = summaries.get(id);
    const gwPts = summary
      ? summary.history.filter((h) => h.round === gwNum).reduce((s, h) => s + h.total_points, 0)
      : 0;
    return { id, elementType: player.element_type, score: gwPts };
  });
  if (scores.length < 11) return 0;
  return findBestXI(scores).totalWithCaptain;
}

// ── Per-GW optimizer prediction (ep_next) ──────────────────────────────────
function calcPerGWPrediction(
  starters: number[],
  captainId: number,
  playerMap: Map<number, Player>
): number {
  let total = 0;
  for (const id of starters) {
    const p = playerMap.get(id);
    if (!p) continue;
    const ep = parseFloat(p.ep_next) || 0;
    let avail = p.chance_of_playing_next_round !== null ? p.chance_of_playing_next_round / 100 : 0.95;
    if (p.status === "u") avail = 0;
    else if (p.status === "i") avail = 0.1;
    total += ep * avail * (id === captainId ? 2 : 1);
  }
  return total;
}

// ── SVG Analytics Chart ─────────────────────────────────────────────────────
function OLSChart({
  data,
  bestPossibles,
  currentGWPrediction,
  currentGW,
}: {
  data: EntryHistory[];
  bestPossibles: Map<number, number>;
  currentGWPrediction: number | null;
  currentGW: number;
}) {
  if (data.length < 2) return null;

  const W = 600;
  const H = 240;
  const padL = 44;
  const padR = 16;
  const padT = 28;
  const padB = 38;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const minGW = data[0].event;
  const maxGW = data[data.length - 1].event;

  const actuals = data.map((d) => d.points);
  const bests = data.map((d) => bestPossibles.get(d.event) ?? d.points + d.points_on_bench);

  const allVals = [...actuals, ...bests];
  if (currentGWPrediction !== null) allVals.push(currentGWPrediction);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const pad = Math.max(4, (rawMax - rawMin) * 0.1);
  const minY = Math.max(0, rawMin - pad);
  const maxY = rawMax + pad;

  const xScale = (gw: number) =>
    padL + ((gw - minGW) / Math.max(1, maxGW - minGW)) * cW;
  const yScale = (v: number) =>
    padT + cH - ((v - minY) / (maxY - minY)) * cH;

  const { slope: aSlope, intercept: aInt } = ols(data.map((d) => ({ x: d.event, y: d.points })));
  const { slope: bSlope, intercept: bInt } = ols(
    data.map((d) => ({ x: d.event, y: bestPossibles.get(d.event) ?? d.points + d.points_on_bench }))
  );

  const polyActual = data.map((d) => `${xScale(d.event).toFixed(1)},${yScale(d.points).toFixed(1)}`).join(" ");
  const polyBest = data.map((d) => {
    const bp = bestPossibles.get(d.event) ?? d.points + d.points_on_bench;
    return `${xScale(d.event).toFixed(1)},${yScale(bp).toFixed(1)}`;
  }).join(" ");

  const variancePoly =
    data.map((d) => `${xScale(d.event).toFixed(1)},${yScale(d.points).toFixed(1)}`).join(" ") +
    " " +
    [...data].reverse().map((d) => {
      const bp = bestPossibles.get(d.event) ?? d.points + d.points_on_bench;
      return `${xScale(d.event).toFixed(1)},${yScale(bp).toFixed(1)}`;
    }).join(" ");

  const yStep = Math.ceil((maxY - minY) / 4 / 5) * 5;
  const yTicks: number[] = [];
  for (let v = Math.ceil(minY / yStep) * yStep; v <= maxY; v += yStep) yTicks.push(v);

  const xLabelGWs = new Set<number>([minGW, maxGW]);
  data.forEach((d) => { if (d.event % 5 === 0) xLabelGWs.add(d.event); });

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 px-1 mb-1 text-[10px] text-fpl-text-secondary">
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-purple-400 rounded" />Actual pts</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-emerald-400 opacity-60 rounded" style={{ borderTop: "2px dashed" }} />Best possible XI</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-white opacity-40 rounded" style={{ borderTop: "2px dashed" }} />OLS trend</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-500 opacity-20" />Missed pts</span>
        {currentGWPrediction !== null && (
          <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-yellow-400 opacity-60 rounded" style={{ borderTop: "2px dashed" }} />Predicted (curr GW)</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 200 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {yTicks.map((v) => (
          <line key={v} x1={padL} y1={yScale(v)} x2={W - padR} y2={yScale(v)}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {yTicks.map((v) => (
          <text key={v} x={padL - 5} y={yScale(v) + 4} textAnchor="end"
            fill="rgba(255,255,255,0.35)" fontSize="9">{v}</text>
        ))}
        {Array.from(xLabelGWs).map((gw) => (
          <text key={gw} x={xScale(gw)} y={H - 6} textAnchor="middle"
            fill="rgba(255,255,255,0.35)" fontSize="9">GW{gw}</text>
        ))}

        <polygon points={variancePoly} fill="rgba(239,68,68,0.12)" />
        <polyline points={polyBest} fill="none" stroke="rgba(52,211,153,0.55)" strokeWidth="1.5" strokeDasharray="5,3" />
        <line
          x1={xScale(minGW)} y1={yScale(bSlope * minGW + bInt)}
          x2={xScale(maxGW)} y2={yScale(bSlope * maxGW + bInt)}
          stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="3,5" />
        <line
          x1={xScale(minGW)} y1={yScale(aSlope * minGW + aInt)}
          x2={xScale(maxGW)} y2={yScale(aSlope * maxGW + aInt)}
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="6,4" />
        {currentGWPrediction !== null && (
          <line x1={padL} y1={yScale(currentGWPrediction)} x2={W - padR} y2={yScale(currentGWPrediction)}
            stroke="rgba(250,204,21,0.55)" strokeWidth="1.2" strokeDasharray="3,4" />
        )}
        <polyline points={polyActual} fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinejoin="round" />
        {data.map((d) => (
          <circle key={d.event}
            cx={xScale(d.event)} cy={yScale(d.points)} r={d.event === currentGW ? 4.5 : 3}
            fill={d.event === currentGW ? "#a78bfa" : "#7c3aed"}
            stroke={d.event === currentGW ? "white" : "none"} strokeWidth="1.5"
          />
        ))}
        {data.map((d) => {
          const bp = bestPossibles.get(d.event) ?? d.points + d.points_on_bench;
          return (
            <circle key={`b${d.event}`}
              cx={xScale(d.event)} cy={yScale(bp)} r="2"
              fill="rgba(52,211,153,0.7)" />
          );
        })}
      </svg>
    </div>
  );
}

// ── Chip badge ──────────────────────────────────────────────────────────────
const CHIP_LABELS: Record<string, string> = {
  wildcard: "WC", freehit: "FH", bboost: "BB", "3xc": "3C",
};
const CHIP_COLORS: Record<string, string> = {
  wildcard: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  freehit: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  bboost: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "3xc": "bg-green-500/20 text-green-300 border-green-500/30",
};

// ── Main Component ──────────────────────────────────────────────────────────
export function GWHistoryPanel() {
  const { teamId, isDemoMode, bootstrap, fixtures, gwRange, picks, currentGW } = useFPL();
  const optimizer = useOptimizer(picks?.picks, bootstrap?.elements, fixtures, gwRange);
  const { data: history, isLoading: historyLoading } = useTeamHistory(isDemoMode ? null : teamId);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load all 15 current squad player summaries in parallel
  const squadIds = useMemo(
    () => picks?.picks.map((p) => p.element) ?? [],
    [picks]
  );
  const { data: summaries, isLoading: summariesLoading } = usePlayerSummaries(squadIds);

  // Build a restricted playerMap with only current squad players (for findBestXI)
  const squadPlayerMap = useMemo(() => {
    if (!bootstrap || squadIds.length === 0) return new Map<number, Player>();
    return new Map(
      squadIds
        .map((id) => [id, bootstrap.elements.find((p) => p.id === id)] as [number, Player | undefined])
        .filter((entry): entry is [number, Player] => entry[1] !== undefined)
    );
  }, [bootstrap, squadIds]);

  // Compute true best possible per GW from player summaries
  const trueBestPossibles = useMemo<Map<number, number>>(() => {
    if (!summaries || squadPlayerMap.size === 0 || !history?.current) {
      return new Map();
    }
    const result = new Map<number, number>();
    for (const gw of history.current) {
      if (gw.points > 0) {
        result.set(gw.event, computeTrueBestPossible(gw.event, squadPlayerMap, summaries));
      }
    }
    return result;
  }, [summaries, squadPlayerMap, history]);

  if (isDemoMode || !teamId) return null;
  if (historyLoading) {
    return (
      <div className="rounded-2xl border border-fpl-border bg-fpl-card/30 p-4">
        <div className="h-4 w-32 rounded bg-fpl-border/40 animate-pulse" />
      </div>
    );
  }
  if (!history?.current?.length) return null;

  const gwData = history.current;
  const chipsByGW = new Map<number, string>(history.chips.map((c) => [c.event, c.name]));

  const allPlayersMap = bootstrap ? new Map(bootstrap.elements.map((p) => [p.id, p])) : new Map<number, Player>();
  const perGWPrediction =
    optimizer && bootstrap
      ? calcPerGWPrediction(optimizer.starters, optimizer.captain, allPlayersMap)
      : null;

  const completedGWs = gwData.filter((d) => d.points > 0);
  const avgPts = completedGWs.length
    ? completedGWs.reduce((s, d) => s + d.points, 0) / completedGWs.length
    : 0;
  const avgBench = completedGWs.length
    ? completedGWs.reduce((s, d) => s + d.points_on_bench, 0) / completedGWs.length
    : 0;
  const best = completedGWs.reduce((m, d) => (d.points > (m?.points ?? 0) ? d : m), completedGWs[0]);

  const isSummariesReady = !summariesLoading && summaries != null;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-fpl-text-primary">GW History</h3>
          {completedGWs.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-fpl-text-secondary">
              <span>Avg <span className="text-fpl-text-primary font-semibold">{avgPts.toFixed(1)}</span> pts/GW</span>
              <span>Bench waste <span className="text-red-400 font-semibold">{avgBench.toFixed(1)}</span> avg</span>
              {best && <span>Best <span className="text-fpl-green font-semibold">GW{best.event} ({best.points})</span></span>}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAnalytics((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            showAnalytics
              ? "bg-fpl-purple/20 border-fpl-purple/50 text-fpl-purple-light"
              : "bg-fpl-panel border-fpl-border text-fpl-text-secondary hover:text-fpl-text-primary"
          )}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          Analytics
          {showAnalytics ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Analytics chart */}
      {showAnalytics && (
        <div className="rounded-2xl border border-fpl-border bg-fpl-card/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-fpl-text-primary">Performance Analytics</p>
              <p className="text-[10px] text-fpl-text-secondary mt-0.5">
                Actual pts vs optimal XI from squad · shaded = missed pts · dashed = OLS trend
              </p>
            </div>
            {summariesLoading && (
              <span className="text-[10px] text-fpl-text-secondary animate-pulse">Loading player data…</span>
            )}
          </div>
          <OLSChart
            data={gwData}
            bestPossibles={isSummariesReady ? trueBestPossibles : new Map(gwData.map((d) => [d.event, d.points + d.points_on_bench]))}
            currentGWPrediction={perGWPrediction}
            currentGW={currentGW}
          />
        </div>
      )}

      {/* History table */}
      <div className="rounded-2xl border border-fpl-border overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-px bg-fpl-panel/80 border-b border-fpl-border px-3 py-2 text-[10px] font-bold text-fpl-text-secondary uppercase tracking-wider">
          <span className="pr-3">GW</span>
          <span className="text-right">Actual</span>
          <span className="text-right">Best XI</span>
          <span className="text-right">Missed</span>
          <span className="text-right hidden sm:block">Hit</span>
          <span className="text-right hidden sm:block">GW Rank</span>
        </div>

        <div className="divide-y divide-fpl-border/40 max-h-80 overflow-y-auto">
          {[...gwData].reverse().map((gw) => {
            const isCurrentGW = gw.event === currentGW;
            const trueBest = trueBestPossibles.get(gw.event);
            const bestPossible = trueBest ?? (isSummariesReady ? null : gw.points + gw.points_on_bench);
            const missed = bestPossible !== null && bestPossible !== undefined ? bestPossible - gw.points : null;
            const chip = chipsByGW.get(gw.event);
            const hasStarted = gw.points > 0;

            const predVariance =
              isCurrentGW && perGWPrediction !== null && hasStarted
                ? gw.points - perGWPrediction
                : null;

            return (
              <div
                key={gw.event}
                className={cn(
                  "grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-px px-3 py-2.5 text-xs transition-colors",
                  isCurrentGW
                    ? "bg-fpl-purple/10 border-l-2 border-l-fpl-purple"
                    : "hover:bg-fpl-panel/30"
                )}
              >
                {/* GW + chip */}
                <div className="flex items-center gap-1.5 pr-3">
                  <span className={cn("font-bold", isCurrentGW ? "text-fpl-purple-light" : "text-fpl-text-primary")}>
                    GW{gw.event}
                  </span>
                  {chip && (
                    <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded border", CHIP_COLORS[chip] ?? "bg-fpl-panel text-fpl-text-secondary border-fpl-border")}>
                      {CHIP_LABELS[chip] ?? chip.toUpperCase()}
                    </span>
                  )}
                  {isCurrentGW && (
                    <span className="text-[9px] font-bold text-fpl-purple-light bg-fpl-purple/20 px-1 py-0.5 rounded border border-fpl-purple/30">
                      LIVE
                    </span>
                  )}
                </div>

                {/* Actual pts */}
                <div className="text-right">
                  {hasStarted ? (
                    <span className="font-bold text-fpl-text-primary">{gw.points}</span>
                  ) : (
                    <span className="text-fpl-text-secondary">—</span>
                  )}
                  {isCurrentGW && perGWPrediction !== null && (
                    <div className="text-[9px] text-fpl-purple-light">
                      ~{perGWPrediction.toFixed(1)} pred
                    </div>
                  )}
                </div>

                {/* Best possible XI */}
                <div className="text-right">
                  {hasStarted ? (
                    summariesLoading && !trueBest ? (
                      <span className="text-fpl-text-secondary animate-pulse">…</span>
                    ) : bestPossible !== null && bestPossible !== undefined ? (
                      <span className="font-semibold text-emerald-400">{Math.round(bestPossible)}</span>
                    ) : (
                      <span className="text-fpl-text-secondary">—</span>
                    )
                  ) : (
                    <span className="text-fpl-text-secondary">—</span>
                  )}
                </div>

                {/* Missed pts */}
                <div className="text-right">
                  {hasStarted ? (
                    <div>
                      {missed !== null ? (
                        <span className={cn("font-semibold", missed > 10 ? "text-red-400" : missed > 5 ? "text-amber-400" : "text-fpl-text-secondary")}>
                          {missed > 0 ? `-${Math.round(missed)}` : "0"}
                        </span>
                      ) : (
                        <span className="text-fpl-text-secondary">—</span>
                      )}
                      {predVariance !== null && (
                        <div className={cn("text-[9px]", predVariance >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {predVariance >= 0 ? "+" : ""}{predVariance.toFixed(1)} vs pred
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-fpl-text-secondary">—</span>
                  )}
                </div>

                {/* Transfer hit */}
                <div className="text-right hidden sm:block">
                  {gw.event_transfers_cost > 0 ? (
                    <span className="text-red-400 font-semibold">-{gw.event_transfers_cost}</span>
                  ) : (
                    <span className="text-fpl-text-secondary">—</span>
                  )}
                </div>

                {/* GW rank */}
                <div className="text-right hidden sm:block text-fpl-text-secondary">
                  {gw.rank ? gw.rank.toLocaleString() : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
