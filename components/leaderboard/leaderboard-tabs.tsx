"use client";

import Image from "next/image";
import { useState } from "react";
import { Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type LeaderboardEntry = {
  userId: string;
  name: string;
  image: string | null;
  totalScore: number;
  averageScore: number;
  count: number;
};

export type LeaderboardDataset = {
  entries: LeaderboardEntry[];
  countLabel: string;
  totalLabel: string;
};

interface LeaderboardTabsProps {
  daily: LeaderboardDataset;
  allTime: LeaderboardDataset;
}

const medalStyles = [
  {
    label: "Gold",
    className:
      "bg-amber-500/90 text-amber-950 shadow-sm shadow-amber-200 dark:text-amber-100",
  },
  {
    label: "Silver",
    className:
      "bg-slate-300/80 text-slate-800 shadow-sm shadow-slate-200 dark:text-slate-900",
  },
  {
    label: "Bronze",
    className:
      "bg-orange-400/80 text-orange-950 shadow-sm shadow-orange-200 dark:text-orange-50",
  },
];

export function LeaderboardTabs({ daily, allTime }: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "allTime">("daily");

  const tabs = [
    { id: "daily" as const, label: "Daily", dataset: daily },
    { id: "allTime" as const, label: "All Time", dataset: allTime },
  ];

  const activeDataset = tabs.find((tab) => tab.id === activeTab)?.dataset ?? daily;

  return (
    <Card className="border border-border/60 bg-card/95 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-background text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {activeDataset.entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No results yet. Be the first to climb the leaderboard!
          </div>
        ) : (
          <ul className="space-y-3">
            {activeDataset.entries.map((entry, index) => {
              const isTopThree = index < 3;
              const medal = medalStyles[index];
              const trimmedName = entry.name?.trim();
              const initials = trimmedName
                ? trimmedName.charAt(0).toUpperCase()
                : "?";

              return (
                <li
                  key={entry.userId}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-xl border bg-background/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow",
                    isTopThree
                      ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                      : "border-transparent"
                  )}
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                    {entry.image ? (
                      <Image
                        src={entry.image}
                        alt={`${entry.name || "Player"} avatar`}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-base font-semibold">
                          {entry.name || "Anonymous Fan"}
                        </span>
                        {isTopThree && medal && (
                          <Badge
                            className={cn(
                              "flex items-center gap-1 border-none text-xs",
                              medal.className
                            )}
                          >
                            <Medal className="h-3.5 w-3.5" />
                            {medal.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {`${entry.count} ${activeDataset.countLabel}${entry.count === 1 ? "" : "s"
                          } • Avg ${Math.round(entry.averageScore)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {Math.round(entry.totalScore)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeDataset.totalLabel}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
