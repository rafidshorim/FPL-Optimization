import { cn } from "@/lib/utils/cn";

interface ReasoningTagProps {
  text: string;
  variant?: "positive" | "negative" | "neutral";
}

const VARIANT_CLASSES: Record<string, string> = {
  positive: "bg-fpl-green/10 text-fpl-green border border-fpl-green/25",
  negative: "bg-fpl-red/10 text-fpl-red border border-fpl-red/25",
  neutral: "bg-fpl-panel text-fpl-text-secondary border border-fpl-border",
};

const REASON_SENTIMENT: Record<string, string> = {
  "Easy": "positive",
  "Favourable": "positive",
  "Good": "positive",
  "High form": "positive",
  "Excellent": "positive",
  "Elite": "positive",
  "Popular": "positive",
  "Low-ownership differential": "positive",
  "Penalty taker": "positive",
  "Dream Team": "positive",
  "Mass": "positive",
  "Strong differential": "positive",
  "Selling": "negative",
  "Injured": "negative",
  "Unavailable": "negative",
  "Suspended": "negative",
  "Difficult": "negative",
  "Very difficult": "negative",
  "Falling": "negative",
  "rotation": "negative",
  "Poor": "negative",
  "Heavy": "negative",
};

function detectSentiment(text: string): string {
  for (const [key, sentiment] of Object.entries(REASON_SENTIMENT)) {
    if (text.includes(key)) return sentiment;
  }
  return "neutral";
}

export function ReasoningTag({ text, variant }: ReasoningTagProps) {
  const resolved = variant ?? detectSentiment(text);
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
        VARIANT_CLASSES[resolved] ?? VARIANT_CLASSES.neutral
      )}
    >
      {text}
    </span>
  );
}
