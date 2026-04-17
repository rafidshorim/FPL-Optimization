"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { PlayerHistory } from "@/types/fpl";
import { useFPL } from "@/context/FPLContext";

interface PlayerHistoryChartProps {
  history: PlayerHistory[];
}

export function PlayerHistoryChart({ history }: PlayerHistoryChartProps) {
  const { bootstrap } = useFPL();

  const data = history.slice(-10).map((h) => {
    const opponent = bootstrap?.teams.find((t) => t.id === h.opponent_team);
    return {
      gw: `GW${h.round}`,
      points: h.total_points,
      minutes: h.minutes,
      goals: h.goals_scored,
      assists: h.assists,
      opponent: opponent?.short_name ?? "?",
      wasHome: h.was_home,
    };
  });

  const avgPoints =
    data.length > 0
      ? data.reduce((s, d) => s + d.points, 0) / data.length
      : 0;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number; name: string }[];
    label?: string;
  }) => {
    if (!active || !payload) return null;
    const row = data.find((d) => d.gw === label);
    return (
      <div className="rounded-xl border border-fpl-border bg-fpl-panel px-3 py-2 shadow-lg text-xs space-y-0.5">
        <p className="font-bold text-fpl-text-primary">{label}</p>
        {row && (
          <p className="text-fpl-text-secondary">
            {row.wasHome ? "vs" : "@"} {row.opponent}
          </p>
        )}
        <p className="text-fpl-purple-light font-semibold">
          {payload[0]?.value} pts
        </p>
        {row && (
          <p className="text-fpl-text-secondary">
            {row.minutes}&apos; • {row.goals}G {row.assists}A
          </p>
        )}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <p className="text-xs text-fpl-text-secondary py-4">No match history available.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
        <XAxis
          dataKey="gw"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={avgPoints}
          stroke="#8b5cf6"
          strokeDasharray="4 2"
          strokeOpacity={0.5}
        />
        <Line
          type="monotone"
          dataKey="points"
          stroke="#a855f7"
          strokeWidth={2}
          dot={{ fill: "#a855f7", r: 3 }}
          activeDot={{ r: 5, fill: "#ec4899" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
