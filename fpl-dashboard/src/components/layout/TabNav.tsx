"use client";

import { LayoutDashboard, Zap, ArrowLeftRight, Calendar } from "lucide-react";
import { useFPL } from "@/context/FPLContext";
import { cn } from "@/lib/utils/cn";
import type { TabId } from "@/types/ui";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Squad", icon: LayoutDashboard },
  { id: "optimizer", label: "Optimizer", icon: Zap },
  { id: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { id: "planner", label: "Planner", icon: Calendar },
];

export function TabNav() {
  const { activeTab, setActiveTab } = useFPL();

  return (
    <div className="flex border-b border-fpl-border">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
              isActive
                ? "border-fpl-purple text-fpl-purple-light"
                : "border-transparent text-fpl-text-secondary hover:text-fpl-text-primary hover:border-fpl-border"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
