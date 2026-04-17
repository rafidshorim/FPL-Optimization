"use client";

import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-fpl-cyan/30 bg-fpl-cyan/10 px-4 py-2.5">
      <Info className="h-4 w-4 shrink-0 text-fpl-cyan" />
      <p className="text-xs text-fpl-text-secondary">
        <span className="font-semibold text-fpl-cyan">Demo mode</span> — viewing
        sample data. Enter your FPL team ID above to see your real squad and
        personalised recommendations.
      </p>
    </div>
  );
}
