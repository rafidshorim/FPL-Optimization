"use client";

import { useFPL } from "@/context/FPLContext";
import { Header } from "@/components/layout/Header";
import { TabNav } from "@/components/layout/TabNav";
import { TeamSummaryBar } from "@/components/team/TeamSummaryBar";
import { SquadGrid } from "@/components/team/SquadGrid";
import { OptimizedXI } from "@/components/optimizer/OptimizedXI";
import { TransferList } from "@/components/transfers/TransferList";
import { PlannerView } from "@/components/planner/PlannerView";
import { PlayerModal } from "@/components/player/PlayerModal";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { Spinner } from "@/components/shared/Spinner";

export default function DashboardPage() {
  const { activeTab, isDemoMode, isLoading, error, mutateEntry, mutatePicks } = useFPL();

  return (
    <div className="min-h-screen bg-fpl-bg">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-5 space-y-4">
        {/* Status banners */}
        {isDemoMode && <DemoBanner />}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => { mutateEntry(); mutatePicks(); }}
          />
        )}

        {/* Summary stats */}
        <TeamSummaryBar />

        {/* Tab navigation */}
        <div className="rounded-xl border border-fpl-border bg-fpl-card overflow-hidden">
          <TabNav />
          <div className="p-4">
            {isLoading && !error ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {activeTab === "overview" && <SquadGrid />}
                {activeTab === "optimizer" && <OptimizedXI />}
                {activeTab === "transfers" && <TransferList />}
                {activeTab === "planner" && <PlannerView />}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Player detail drawer */}
      <PlayerModal />
    </div>
  );
}
