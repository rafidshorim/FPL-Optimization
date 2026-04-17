"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFPL } from "@/context/FPLContext";
import { Trophy } from "lucide-react";
import { TeamIDForm } from "@/components/team/TeamIDForm";
import { DemoBanner } from "@/components/shared/DemoBanner";

export default function HomePage() {
  const { teamId } = useFPL();
  const router = useRouter();

  // If team ID is already set (e.g. from localStorage), jump straight to dashboard
  useEffect(() => {
    if (teamId) router.replace("/dashboard");
  }, [teamId, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-gradient shadow-xl shadow-fpl-purple/30">
          <Trophy className="h-9 w-9 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-fpl-text-primary">
          FPL Scout
        </h1>
        <p className="max-w-sm text-fpl-text-secondary text-base leading-relaxed">
          Your personal Fantasy Premier League decision dashboard. Lineup
          optimizer, transfer recommendations, fixture difficulty, and
          projected points — powered by the official FPL API.
        </p>
      </div>

      {/* Team ID form */}
      <TeamIDForm />

      {/* Demo option */}
      <div className="mt-8 w-full max-w-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-fpl-border" />
          <span className="text-xs text-fpl-text-secondary">or</span>
          <div className="flex-1 h-px bg-fpl-border" />
        </div>
        <button
          onClick={() => {
            // Navigate to dashboard in demo mode (no team ID)
            if (typeof window !== "undefined") {
              window.location.href = "/dashboard";
            }
          }}
          className="w-full h-11 rounded-xl border border-fpl-border bg-fpl-panel text-sm font-medium text-fpl-text-secondary hover:border-fpl-purple/40 hover:text-fpl-text-primary transition-all"
        >
          Explore with demo data →
        </button>
        <DemoBanner />
      </div>

      {/* Feature bullets */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {[
          { icon: "⚡", label: "Lineup optimizer", desc: "Best XI across all valid FPL formations" },
          { icon: "↔️", label: "Transfer engine", desc: "Ranked OUT→IN pairs with reasoning" },
          { icon: "📅", label: "GW planner", desc: "Projected scores over 1, 3, or 5 GWs" },
          { icon: "🔍", label: "Player insights", desc: "History, fixtures, ICT radar, and news" },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-fpl-border bg-fpl-card px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm font-semibold text-fpl-text-primary">{f.label}</span>
            </div>
            <p className="mt-0.5 text-xs text-fpl-text-secondary">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
