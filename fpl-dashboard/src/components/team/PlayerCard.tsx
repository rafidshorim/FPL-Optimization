"use client";

import Image from "next/image";
import { Shield, Star, StarHalf, AlertTriangle } from "lucide-react";
import type { Player, Pick } from "@/types/fpl";
import { useFPL } from "@/context/FPLContext";
import { StatusDot } from "@/components/shared/StatusDot";
import { StatPill } from "@/components/shared/StatPill";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatters";
import { POSITION_NAMES } from "@/lib/utils/constants";
import { getUpcomingFixtures } from "@/lib/engine/fixture-difficulty";
import type { PlayerCardBadge } from "@/types/ui";

interface PlayerCardProps {
  player: Player;
  pick?: Pick;
  projectedScore?: number;
  badges?: PlayerCardBadge[];
  highlight?: "start" | "bench" | "captain" | "vice" | "sell" | "buy";
  compact?: boolean;
  onClick?: () => void;
}

const BADGE_STYLES: Record<string, string> = {
  buy: "bg-fpl-green/20 text-fpl-green border-fpl-green/40",
  sell: "bg-fpl-red/20 text-fpl-red border-fpl-red/40",
  start: "bg-fpl-purple/20 text-fpl-purple-light border-fpl-purple/40",
  bench: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  risk: "bg-fpl-amber/20 text-fpl-amber border-fpl-amber/40",
  hot: "bg-fpl-pink/20 text-fpl-pink border-fpl-pink/40",
  captain: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
  vice: "bg-yellow-600/20 text-yellow-500 border-yellow-600/40",
};

const HIGHLIGHT_BORDERS: Record<string, string> = {
  start: "border-fpl-green",
  bench: "border-gray-600",
  captain: "border-yellow-400",
  vice: "border-yellow-600",
  sell: "border-fpl-red",
  buy: "border-fpl-green",
};

export function PlayerCard({
  player,
  pick,
  projectedScore,
  badges = [],
  highlight,
  compact = false,
  onClick,
}: PlayerCardProps) {
  const { fixtures, gwRange, bootstrap } = useFPL();

  const upcomingFixtures =
    fixtures && gwRange
      ? getUpcomingFixtures(player.team, fixtures, gwRange.slice(0, 3))
      : [];

  const teamName =
    bootstrap?.teams.find((t) => t.id === player.team)?.short_name ?? "???";

  const posName = POSITION_NAMES[player.element_type] ?? "???";
  const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`;

  const borderClass = highlight ? HIGHLIGHT_BORDERS[highlight] : "border-fpl-border";

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "group relative w-full rounded-lg border bg-fpl-card px-2 py-1.5 text-left transition-all hover:border-fpl-purple/40 hover:bg-fpl-panel active:scale-[0.98]",
          borderClass
        )}
      >
        <div className="flex items-center gap-2">
          <StatusDot status={player.status} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-fpl-text-primary truncate">{player.web_name}</div>
            <div className="text-[10px] text-fpl-text-secondary">{teamName} · {posName}</div>
          </div>
          {pick?.is_captain && (
            <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1 py-0.5 rounded">C</span>
          )}
          {pick?.is_vice_captain && (
            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-600/10 px-1 py-0.5 rounded">V</span>
          )}
          <div className="text-right shrink-0">
            <div className="text-xs font-bold text-fpl-text-primary">{formatPrice(player.now_cost)}</div>
            {projectedScore !== undefined && (
              <div className="text-[10px] text-fpl-purple-light">~{projectedScore.toFixed(1)}</div>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-xl border bg-fpl-card p-3 text-left transition-all",
        "hover:border-fpl-purple/50 hover:shadow-md hover:shadow-fpl-purple/10 active:scale-[0.98]",
        borderClass
      )}
    >
      {/* Badges row */}
      {badges.length > 0 && (
        <div className="absolute -top-2 left-2 flex gap-1">
          {badges.map((b) => (
            <span
              key={b.label}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                BADGE_STYLES[b.variant]
              )}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Player photo */}
        <div className="relative shrink-0 h-12 w-10 overflow-hidden rounded-lg bg-fpl-panel">
          <Image
            src={photoUrl}
            alt={player.web_name}
            fill
            className="object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
            unoptimized
          />
          {/* Position badge overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[8px] font-bold text-white">
            {posName}
          </div>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-fpl-text-primary truncate">{player.web_name}</span>
                {pick?.is_captain && (
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                )}
                {pick?.is_vice_captain && (
                  <StarHalf className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusDot status={player.status} />
                <span className="text-[11px] text-fpl-text-secondary">{teamName}</span>
                {player.news && (
                  <span title={player.news}><AlertTriangle className="h-3 w-3 text-fpl-amber" /></span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-fpl-text-primary">{formatPrice(player.now_cost)}</div>
              {projectedScore !== undefined && (
                <div className="text-[11px] font-medium text-fpl-purple-light">
                  ~{projectedScore.toFixed(1)} proj
                </div>
              )}
            </div>
          </div>

          {/* Stat pills */}
          <div className="mt-2 flex flex-wrap gap-1">
            <StatPill label="Pts" value={player.total_points} variant="purple" />
            <StatPill label="Form" value={parseFloat(player.form).toFixed(1)} variant={parseFloat(player.form) >= 6 ? "positive" : "default"} />
            <StatPill label="PPG" value={parseFloat(player.points_per_game).toFixed(1)} />
            {player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 100 && (
              <StatPill
                label="Avail"
                value={`${player.chance_of_playing_next_round}%`}
                variant={player.chance_of_playing_next_round < 50 ? "negative" : "warning"}
              />
            )}
          </div>

          {/* Upcoming fixtures */}
          {upcomingFixtures.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {upcomingFixtures.slice(0, 3).map((fix) => {
                const opponent = bootstrap?.teams.find((t) => t.id === fix.opponentId);
                return (
                  <DifficultyBadge
                    key={fix.event}
                    difficulty={fix.difficulty}
                    teamName={opponent?.short_name}
                    isHome={fix.isHome}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Injury news */}
      {player.news && (
        <div className="mt-2 rounded-md bg-fpl-amber/10 border border-fpl-amber/20 px-2 py-1 text-[10px] text-fpl-amber">
          {player.news}
        </div>
      )}
    </button>
  );
}
