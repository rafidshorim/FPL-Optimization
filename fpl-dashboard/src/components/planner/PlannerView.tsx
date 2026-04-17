"use client";

import { Calendar } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { HorizonTable } from "./HorizonTable";
import { Spinner } from "@/components/shared/Spinner";

export function PlannerView() {
  const { picks, bootstrap, fixtures, gwRange, horizonGW, setHorizonGW, isLoading } = useFPL();

  if (isLoading && !picks) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!picks || !bootstrap || !fixtures) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-fpl-text-primary flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fpl-purple" />
            Gameweek Planner
          </h2>
          <p className="text-xs text-fpl-text-secondary mt-0.5">
            Projected scores per player across your selected horizon. Green = best picks.
          </p>
        </div>
        <div className="flex rounded-lg border border-fpl-border bg-fpl-panel p-0.5">
          {([1, 3, 5] as const).map((gw) => (
            <button
              key={gw}
              onClick={() => setHorizonGW(gw)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                horizonGW === gw
                  ? "bg-fpl-purple text-white"
                  : "text-fpl-text-secondary hover:text-fpl-text-primary"
              }`}
            >
              {gw === 1 ? "1 GW" : `${gw} GWs`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-fpl-border bg-fpl-card overflow-hidden">
        <HorizonTable
          picks={picks.picks}
          players={bootstrap.elements}
          fixtures={fixtures}
          gwRange={gwRange}
          teams={bootstrap.teams}
        />
      </div>

      <p className="text-[10px] text-fpl-text-secondary text-center">
        Scores are projected (0–10 scale) based on form, PPG, expected points, ICT, and fixture difficulty.
        Bench players shown at reduced opacity.
      </p>
    </div>
  );
}
