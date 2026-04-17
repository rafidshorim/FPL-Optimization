"use client";

import { useFPL } from "@/context/FPLContext";
import { cn } from "@/lib/utils/cn";
import type { HorizonGW } from "@/types/ui";

const OPTIONS: { value: HorizonGW; label: string }[] = [
  { value: 1, label: "Next GW" },
  { value: 3, label: "3 GWs" },
  { value: 5, label: "5 GWs" },
];

export function GWSelector() {
  const { horizonGW, setHorizonGW, currentGW } = useFPL();

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-fpl-text-secondary hidden sm:block">Horizon:</span>
      <div className="flex rounded-lg border border-fpl-border bg-fpl-panel p-0.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setHorizonGW(opt.value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-all",
              horizonGW === opt.value
                ? "bg-fpl-purple text-white shadow"
                : "text-fpl-text-secondary hover:text-fpl-text-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span className="text-xs font-medium text-fpl-text-secondary">
        GW{currentGW}
      </span>
    </div>
  );
}
