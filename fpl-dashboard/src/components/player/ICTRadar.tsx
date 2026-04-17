"use client";

import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { Player } from "@/types/fpl";

interface ICTRadarProps {
  player: Player;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Influence:
    "How much a player has impacted the match — tackles, clearances, key passes, and defensive/offensive actions that shape the game.",
  Creativity:
    "A player's ability to generate scoring opportunities for teammates — key passes, through balls, crosses, and chances created.",
  Threat:
    "A player's attacking danger in front of goal — based on shots, shots on target, and positioning in dangerous areas.",
  ICT: "Combined ICT Index score. A composite of Influence, Creativity and Threat rolled into one overall attacking metric.",
  Form: "Rolling 5-gameweek average points. High form means consistent recent returns.",
  xGI: "Expected Goal Involvements per 90 minutes — combines expected goals (xG) and expected assists (xA) to measure attacking output.",
};

function CategoryLabel({ name }: { name: string }) {
  const [visible, setVisible] = useState(false);
  const desc = CATEGORY_DESCRIPTIONS[name];

  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="text-[10px] text-slate-400 underline decoration-dotted underline-offset-2">
        {name}
      </span>
      {visible && desc && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-44 rounded-lg border border-fpl-border bg-fpl-panel px-2.5 py-2 text-[10px] leading-relaxed text-fpl-text-secondary shadow-xl pointer-events-none">
          {desc}
        </span>
      )}
    </span>
  );
}

export function ICTRadar({ player }: ICTRadarProps) {
  const data = [
    { subject: "Influence", value: Math.min(parseFloat(player.influence) / 10, 100) },
    { subject: "Creativity", value: Math.min(parseFloat(player.creativity) / 10, 100) },
    { subject: "Threat", value: Math.min(parseFloat(player.threat) / 15, 100) },
    { subject: "ICT", value: Math.min(parseFloat(player.ict_index) / 3, 100) },
    { subject: "Form", value: Math.min(parseFloat(player.form) * 8, 100) },
    { subject: "xGI", value: Math.min(player.expected_goal_involvements_per_90 * 60, 100) },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="rgba(139,92,246,0.2)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <Radar
            name={player.web_name}
            dataKey="value"
            stroke="#a855f7"
            fill="#8b5cf6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Hoverable category legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {Object.keys(CATEGORY_DESCRIPTIONS).map((name) => (
          <CategoryLabel key={name} name={name} />
        ))}
      </div>
    </div>
  );
}
