import { cn } from "@/lib/utils/cn";
import type { Formation } from "@/types/engine";

interface FormationBadgeProps {
  formation: Formation;
  isRecommended?: boolean;
  isCurrent?: boolean;
}

export function FormationBadge({ formation, isRecommended, isCurrent }: FormationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-bold",
        isRecommended
          ? "bg-fpl-purple/20 text-fpl-purple-light border border-fpl-purple/40"
          : isCurrent
          ? "bg-fpl-panel text-fpl-text-secondary border border-fpl-border"
          : "bg-fpl-panel text-fpl-text-secondary border border-fpl-border"
      )}
    >
      {formation}
      {isRecommended && (
        <span className="text-[9px] font-semibold uppercase tracking-wide text-fpl-green">
          ✓ Best
        </span>
      )}
      {isCurrent && !isRecommended && (
        <span className="text-[9px] font-semibold uppercase tracking-wide text-fpl-text-secondary">
          Current
        </span>
      )}
    </span>
  );
}
