"use client";

import { useState, FormEvent } from "react";
import { Search, X } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { cn } from "@/lib/utils/cn";

interface TeamIDFormProps {
  compact?: boolean;
}

export function TeamIDForm({ compact = false }: TeamIDFormProps) {
  const { teamId, setTeamId } = useFPL();
  const [value, setValue] = useState(teamId ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a valid FPL team ID");
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setError("Team ID must be a number");
      return;
    }
    setError("");
    setTeamId(trimmed);
  }

  function handleClear() {
    setValue("");
    setTeamId(null);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Team ID"
            className="h-8 w-32 rounded-lg border border-fpl-border bg-fpl-panel pl-3 pr-7 text-xs text-fpl-text-primary placeholder:text-fpl-text-secondary/50 focus:border-fpl-purple focus:outline-none focus:ring-1 focus:ring-fpl-purple/30"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fpl-text-secondary hover:text-fpl-text-primary"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-8 rounded-lg bg-fpl-purple px-3 text-xs font-medium text-white hover:bg-fpl-purple-light transition-colors"
        >
          Load
        </button>
      </form>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className={cn("relative", error && "")}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fpl-text-secondary" />
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            placeholder="Enter your FPL team ID (e.g. 12345)"
            className={cn(
              "h-12 w-full rounded-xl border bg-fpl-panel pl-10 pr-4 text-sm text-fpl-text-primary placeholder:text-fpl-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-fpl-purple/40 transition-colors",
              error ? "border-fpl-red" : "border-fpl-border focus:border-fpl-purple"
            )}
          />
        </div>
        {error && <p className="text-xs text-fpl-red">{error}</p>}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-purple-gradient font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Load My Team
        </button>
        <p className="text-center text-xs text-fpl-text-secondary">
          Find your team ID at{" "}
          <span className="text-fpl-purple-light">fantasy.premierleague.com</span> →
          Points → your team URL contains the ID
        </p>
      </form>
    </div>
  );
}
