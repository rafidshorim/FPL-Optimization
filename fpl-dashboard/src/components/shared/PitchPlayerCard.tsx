"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { Player, Pick } from "@/types/fpl";
import { getUpcomingFixtures } from "@/lib/engine/fixture-difficulty";
import type { Fixture } from "@/types/fpl";

interface PitchPlayerCardProps {
  player: Player;
  pick?: Pick;
  fixtures?: Fixture[];
  gwRange?: number[];
  teamShortName?: string;
  teams?: { id: number; short_name: string }[];
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  /** Green ring = optimizer wants to start, gray = suggested bench */
  optimizerHighlight?: "start" | "bench" | null;
  onClick?: () => void;
}

/** Jersey shirt URL from the official FPL CDN */
function jerseyUrl(teamCode: number, isGK: boolean): string {
  return isGK
    ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}_1-110.png`
    : `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-110.png`;
}

/** Availability colour: green = available, yellow = doubtful, red = injured/unavailable */
function statusColor(status: string): string {
  if (status === "a") return "bg-green-400";
  if (status === "d") return "bg-yellow-400";
  return "bg-red-500";
}

export function PitchPlayerCard({
  player,
  pick,
  fixtures = [],
  gwRange = [],
  teamShortName,
  teams = [],
  isCaptain,
  isViceCaptain,
  optimizerHighlight,
  onClick,
}: PitchPlayerCardProps) {
  const isGK = player.element_type === 1;
  const shirt = jerseyUrl(player.team_code, isGK);

  // Next fixture label (e.g. "BHA (H)")
  const upcomingFixtures =
    gwRange.length > 0
      ? getUpcomingFixtures(player.team, fixtures, [gwRange[0]])
      : [];

  let fixtureLabel = "";
  if (upcomingFixtures.length > 0) {
    const fix = upcomingFixtures[0];
    const opp = teams.find((t) => t.id === fix.opponentId);
    fixtureLabel = `${opp?.short_name ?? "?"} (${fix.isHome ? "H" : "A"})`;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center cursor-pointer select-none",
        "transition-transform duration-150 hover:scale-105 active:scale-95"
      )}
    >
      {/* Card shell */}
      <div
        className={cn(
          "relative flex flex-col items-center rounded-lg overflow-hidden shadow-lg",
          "bg-white/95 border-2 transition-colors",
          optimizerHighlight === "start"
            ? "border-green-400 shadow-green-400/30"
            : optimizerHighlight === "bench"
            ? "border-gray-400 opacity-75"
            : "border-transparent group-hover:border-white/60"
        )}
        style={{ width: 72 }}
      >
        {/* Status dot */}
        <span
          className={cn(
            "absolute top-1 left-1 h-3 w-3 rounded-full border border-white/80 z-10",
            statusColor(player.status)
          )}
        />

        {/* Captain / Vice badge */}
        {isCaptain && (
          <span className="absolute top-0.5 right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 text-[9px] font-black text-white shadow">
            C
          </span>
        )}
        {isViceCaptain && !isCaptain && (
          <span className="absolute top-0.5 right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-black text-gray-800 shadow">
            V
          </span>
        )}

        {/* Jersey image */}
        <div className="flex items-center justify-center pt-4 pb-2 px-1" style={{ height: 74 }}>
          <Image
            src={shirt}
            alt={`${teamShortName ?? player.team_code} shirt`}
            width={54}
            height={62}
            className="object-contain drop-shadow-sm"
            unoptimized
            onError={(e) => {
              // Fallback: hide broken image, show coloured circle
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Name */}
        <div className="w-full bg-[#1a1a2e] px-1 py-0.5 text-center">
          <p className="truncate text-[10px] font-bold leading-tight text-white">
            {player.web_name}
          </p>
        </div>

        {/* Fixture */}
        {fixtureLabel && (
          <div className="w-full bg-[#2a2a4e] px-1 py-0.5 text-center">
            <p className="truncate text-[9px] font-medium leading-tight text-slate-300">
              {fixtureLabel}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
