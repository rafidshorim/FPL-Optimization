"use client";

import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import type { TransferPair } from "@/types/engine";
import { useFPL } from "@/context/FPLContext";
import { ReasoningTag } from "./ReasoningTag";
import { StatusDot } from "@/components/shared/StatusDot";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatters";
import { getUpcomingFixtures } from "@/lib/engine/fixture-difficulty";

interface TransferRowProps {
  pair: TransferPair;
}

export function TransferRow({ pair }: TransferRowProps) {
  const { bootstrap, fixtures, gwRange, setSelectedPlayerId } = useFPL();

  if (!bootstrap) return null;

  const playerMap = new Map(bootstrap.elements.map((p) => [p.id, p]));
  const outPlayer = playerMap.get(pair.out.playerId);
  const inPlayer = playerMap.get(pair.in.playerId);

  if (!outPlayer || !inPlayer) return null;

  const outTeam = bootstrap.teams.find((t) => t.id === outPlayer.team);
  const inTeam = bootstrap.teams.find((t) => t.id === inPlayer.team);

  const inFixtures = fixtures
    ? getUpcomingFixtures(inPlayer.team, fixtures, gwRange.slice(0, 3))
    : [];

  const netGain = pair.netGain;
  const priceChange = pair.priceDiff; // positive = costs more, negative = saves money

  return (
    <div className="rounded-xl border border-fpl-border bg-fpl-card p-4 space-y-3 hover:border-fpl-purple/30 transition-colors">
      {/* Rank badge + gain */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-fpl-purple/20 border border-fpl-purple/30 px-2 py-0.5 text-[10px] font-bold text-fpl-purple-light">
          #{pair.rank}
        </span>
        <div
          className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold",
            netGain >= 0
              ? "bg-fpl-green/15 text-fpl-green"
              : "bg-fpl-red/15 text-fpl-red"
          )}
        >
          {netGain >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {netGain >= 0 ? "+" : ""}{netGain.toFixed(1)} pts gain
        </div>
      </div>

      {/* Transfer pair */}
      <div className="flex items-center gap-3">
        {/* OUT player */}
        <button
          onClick={() => setSelectedPlayerId(outPlayer.id)}
          className="flex-1 rounded-lg border border-fpl-red/30 bg-fpl-red/10 p-2.5 text-left hover:border-fpl-red/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-bold uppercase text-fpl-red">Sell</span>
            <StatusDot status={outPlayer.status} />
          </div>
          <div className="text-sm font-bold text-fpl-text-primary">{outPlayer.web_name}</div>
          <div className="text-[10px] text-fpl-text-secondary">{outTeam?.short_name} · {formatPrice(pair.out.salePrice)}</div>
          <div className="text-[10px] text-fpl-text-secondary mt-0.5">
            Proj: {pair.out.projectedScore.toFixed(1)}
          </div>
        </button>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <ArrowRight className="h-4 w-4 text-fpl-text-secondary" />
          {priceChange !== 0 && (
            <span className={cn("text-[9px] font-semibold", priceChange > 0 ? "text-fpl-red" : "text-fpl-green")}>
              {priceChange > 0 ? "+" : ""}{formatPrice(priceChange)}
            </span>
          )}
        </div>

        {/* IN player */}
        <button
          onClick={() => setSelectedPlayerId(inPlayer.id)}
          className="flex-1 rounded-lg border border-fpl-green/30 bg-fpl-green/10 p-2.5 text-left hover:border-fpl-green/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-bold uppercase text-fpl-green">Buy</span>
            <StatusDot status={inPlayer.status} />
          </div>
          <div className="text-sm font-bold text-fpl-text-primary">{inPlayer.web_name}</div>
          <div className="text-[10px] text-fpl-text-secondary">{inTeam?.short_name} · {formatPrice(inPlayer.now_cost)}</div>
          <div className="text-[10px] text-fpl-text-secondary mt-0.5">
            Proj: {pair.in.projectedScore.toFixed(1)}
          </div>
        </button>
      </div>

      {/* Buy player upcoming fixtures */}
      {inFixtures.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-fpl-text-secondary shrink-0">{inPlayer.web_name}&apos;s next:</span>
          {inFixtures.map((fix) => {
            const opp = bootstrap.teams.find((t) => t.id === fix.opponentId);
            return (
              <DifficultyBadge
                key={fix.event}
                difficulty={fix.difficulty}
                teamName={opp?.short_name}
                isHome={fix.isHome}
              />
            );
          })}
        </div>
      )}

      {/* Reasoning tags */}
      {pair.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pair.reasons.map((reason, i) => (
            <ReasoningTag key={i} text={reason} />
          ))}
        </div>
      )}
    </div>
  );
}
