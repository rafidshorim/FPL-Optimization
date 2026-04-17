"use client";

import { Wallet, TrendingUp, Award, Target } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { formatPrice, formatPoints, formatRank } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/shared/Skeleton";

export function TeamSummaryBar() {
  const { entry, picks, isLoading } = useFPL();

  if (isLoading && !entry) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const bank = picks?.entry_history.bank;
  const squadValue = picks?.entry_history.value;
  const totalPts = entry?.summary_overall_points;
  const overallRank = entry?.summary_overall_rank;

  const stats = [
    {
      label: "Bank",
      value: bank != null ? formatPrice(bank) : "—",
      icon: Wallet,
      color: "text-fpl-green",
    },
    {
      label: "Squad Value",
      value: squadValue != null ? formatPrice(squadValue) : "—",
      icon: TrendingUp,
      color: "text-fpl-cyan",
    },
    {
      label: "Total Points",
      value: totalPts != null ? formatPoints(totalPts) : "—",
      icon: Award,
      color: "text-fpl-purple-light",
    },
    {
      label: "Overall Rank",
      value: overallRank != null ? `#${formatRank(overallRank)}` : "—",
      icon: Target,
      color: "text-fpl-pink",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-fpl-border bg-fpl-card px-4 py-3"
          >
            <div className={`rounded-lg p-1.5 bg-fpl-panel ${stat.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-fpl-text-secondary">{stat.label}</div>
              <div className="text-sm font-bold text-fpl-text-primary">{stat.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
