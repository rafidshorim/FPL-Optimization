"use client";

import type { PlayerFixture } from "@/types/fpl";
import { useFPL } from "@/context/FPLContext";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { cn } from "@/lib/utils/cn";

interface FixtureListProps {
  fixtures: PlayerFixture[];
  maxItems?: number;
}

export function FixtureList({ fixtures, maxItems = 5 }: FixtureListProps) {
  const { bootstrap } = useFPL();
  const upcoming = fixtures.filter((f) => !f.finished).slice(0, maxItems);

  if (upcoming.length === 0) {
    return <p className="text-xs text-fpl-text-secondary py-2">No upcoming fixtures found.</p>;
  }

  return (
    <div className="space-y-1.5">
      {upcoming.map((fix) => {
        const opponent = bootstrap?.teams.find(
          (t) => t.id === (fix.is_home ? fix.team_a : fix.team_h)
        );
        const date = new Date(fix.kickoff_time).toLocaleDateString("en-GB", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        return (
          <div
            key={fix.id}
            className="flex items-center justify-between rounded-lg border border-fpl-border bg-fpl-panel px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-fpl-text-secondary w-20 shrink-0">{date}</span>
              <span className="text-xs font-medium text-fpl-text-primary">
                {fix.is_home ? "vs" : "@"} {opponent?.short_name ?? "?"}
              </span>
              <span
                className={cn(
                  "text-[9px] font-bold uppercase px-1 py-0.5 rounded",
                  fix.is_home
                    ? "bg-fpl-purple/20 text-fpl-purple-light"
                    : "bg-fpl-panel text-fpl-text-secondary border border-fpl-border"
                )}
              >
                {fix.is_home ? "H" : "A"}
              </span>
            </div>
            <DifficultyBadge difficulty={fix.difficulty} />
          </div>
        );
      })}
    </div>
  );
}
