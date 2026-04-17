import { cn } from "@/lib/utils/cn";
import { STATUS_LABELS } from "@/lib/utils/constants";

interface StatusDotProps {
  status: string;
  className?: string;
  showLabel?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  a: "bg-fpl-green",
  d: "bg-yellow-400",
  i: "bg-fpl-red",
  u: "bg-gray-500",
  s: "bg-fpl-amber",
  n: "bg-gray-600",
};

export function StatusDot({ status, className, showLabel = false }: StatusDotProps) {
  const color = STATUS_COLORS[status] ?? "bg-gray-500";
  const label = STATUS_LABELS[status] ?? "Unknown";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("h-2 w-2 rounded-full shrink-0", color)}
        title={label}
      />
      {showLabel && (
        <span className="text-xs text-fpl-text-secondary">{label}</span>
      )}
    </span>
  );
}
