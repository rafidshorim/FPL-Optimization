import { cn } from "@/lib/utils/cn";

interface StatPillProps {
  label: string;
  value: string | number;
  variant?: "default" | "positive" | "negative" | "warning" | "purple";
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  default: "bg-fpl-panel text-fpl-text-secondary border border-fpl-border",
  positive: "bg-fpl-green/15 text-fpl-green border border-fpl-green/30",
  negative: "bg-fpl-red/15 text-fpl-red border border-fpl-red/30",
  warning: "bg-fpl-amber/15 text-fpl-amber border border-fpl-amber/30",
  purple: "bg-fpl-purple/15 text-fpl-purple-light border border-fpl-purple/30",
};

export function StatPill({ label, value, variant = "default", className }: StatPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <span className="opacity-70">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
