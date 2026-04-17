import { cn } from "@/lib/utils/cn";

interface DifficultyBadgeProps {
  difficulty: number;
  teamName?: string;
  isHome?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const FDR_CLASSES: Record<number, string> = {
  1: "bg-fpl-green text-white",
  2: "bg-green-400 text-gray-900",
  3: "bg-yellow-400 text-gray-900",
  4: "bg-orange-500 text-white",
  5: "bg-fpl-red text-white",
};

export function DifficultyBadge({
  difficulty,
  teamName,
  isHome,
  className,
  size = "sm",
}: DifficultyBadgeProps) {
  const colorClass = FDR_CLASSES[difficulty] ?? "bg-gray-500 text-white";
  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-semibold",
        colorClass,
        sizeClass,
        className
      )}
      title={`FDR: ${difficulty}/5`}
    >
      {teamName && (
        <span>{teamName}</span>
      )}
      {isHome !== undefined && (
        <span className="opacity-70 text-[10px]">{isHome ? "(H)" : "(A)"}</span>
      )}
      <span>{difficulty}</span>
    </span>
  );
}
