"use client";

import { Trophy, ChevronDown } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { TeamIDForm } from "@/components/team/TeamIDForm";
import { GWSelector } from "./GWSelector";
import { formatPoints, formatRank } from "@/lib/utils/formatters";

export function Header() {
  const { entry, isDemoMode, currentGW } = useFPL();

  return (
    <header className="sticky top-0 z-40 border-b border-fpl-border bg-fpl-bg/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-gradient shadow-lg shadow-fpl-purple/20">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-fpl-text-primary leading-tight">FPL Scout</div>
              <div className="text-[10px] text-fpl-text-secondary">Decision Dashboard</div>
            </div>
          </div>

          {/* Team info */}
          {entry && (
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-fpl-border bg-fpl-panel">
              <div>
                <div className="text-xs font-semibold text-fpl-text-primary leading-tight">{entry.name}</div>
                <div className="text-[10px] text-fpl-text-secondary">
                  {formatPoints(entry.summary_overall_points)} pts • #{formatRank(entry.summary_overall_rank)}
                </div>
              </div>
            </div>
          )}

          {isDemoMode && (
            <span className="hidden md:block text-[10px] font-semibold uppercase tracking-widest text-fpl-cyan border border-fpl-cyan/30 bg-fpl-cyan/10 px-2 py-1 rounded-full">
              Demo
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* GW selector */}
          <GWSelector />

          {/* Team ID input (compact) */}
          <TeamIDForm compact />
        </div>
      </div>
    </header>
  );
}
