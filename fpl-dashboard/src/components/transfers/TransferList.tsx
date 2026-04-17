"use client";

import { ArrowLeftRight, Info } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { useTransfers } from "@/hooks/useTransfers";
import { TransferRow } from "./TransferRow";
import { Spinner } from "@/components/shared/Spinner";
import { PlayerCardSkeleton } from "@/components/shared/Skeleton";
import { formatPrice } from "@/lib/utils/formatters";

export function TransferList() {
  const { picks, bootstrap, fixtures, gwRange, isLoading } = useFPL();
  const transfers = useTransfers(picks, bootstrap?.elements, fixtures, gwRange);

  const bank = picks?.entry_history.bank;
  const freeTransfers = 1; // default, could be derived from history in future

  if (isLoading && !picks) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!picks || !bootstrap) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-fpl-text-primary flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-fpl-purple" />
            Transfer Recommendations
          </h2>
          <p className="text-xs text-fpl-text-secondary mt-0.5">
            Ranked by projected points gain over selected horizon
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-lg border border-fpl-border bg-fpl-panel px-3 py-1.5 text-fpl-text-secondary">
            Bank: <span className="font-bold text-fpl-green">{bank != null ? formatPrice(bank) : "—"}</span>
          </span>
          <span className="rounded-lg border border-fpl-border bg-fpl-panel px-3 py-1.5 text-fpl-text-secondary">
            Free transfers: <span className="font-bold text-fpl-cyan">{freeTransfers}</span>
          </span>
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-2 rounded-xl border border-fpl-border bg-fpl-panel px-3 py-2.5 text-[11px] text-fpl-text-secondary">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-fpl-cyan" />
        <p>
          Recommendations consider your current squad structure, budget, and the 3-player
          per club rule. Sell prices are approximate (exact prices depend on purchase
          history). Click any player to view their full stats.
        </p>
      </div>

      {transfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-fpl-text-secondary">
          <ArrowLeftRight className="h-8 w-8 opacity-30" />
          <p className="text-sm">No transfer suggestions available for this horizon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((pair) => (
            <TransferRow key={`${pair.out.playerId}-${pair.in.playerId}`} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
}
