"use client";

import Image from "next/image";
import type { QuizResultsLeaderboardProps } from "./types";
import { cn } from "@/lib/utils";
import { Coins, Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

export function QuizResultsLeaderboard({
  entries,
  theme,
}: QuizResultsLeaderboardProps) {
  if (!entries.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-6 text-center text-sm text-zinc-500">
        Leaderboard data is not available yet.
      </div>
    );
  }

  const top3 = entries.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Podium Section */}
      <div className="flex items-end justify-center gap-4 pb-4 pt-8">
        {/* 2nd Place */}
        {top3[1] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <div className="relative h-14 w-14 overflow-hidden rounded-md border-2 border-zinc-700 bg-zinc-800 shadow-md">
                {top3[1].userImage ? (
                  <Image
                    src={top3[1].userImage}
                    alt={top3[1].userName || ""}
                    fill
                    className="object-cover"
                    unoptimized={!top3[1].userImage.startsWith("https://lh3.googleusercontent.com") && !top3[1].userImage.includes("supabase")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-zinc-500">{(top3[1].userName || "U")[0]}</div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-sm bg-zinc-300 px-1 py-0.5 text-[10px] font-black leading-none text-zinc-900 shadow-sm">
                2
              </div>
            </div>
            <div className="h-20 w-16 rounded-t-sm bg-zinc-800 text-center shadow-inner">
              <div className="h-1 w-full bg-zinc-700/50" />
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center z-10"
          >
            <div className="relative mb-3">
              <div className="relative h-20 w-20 overflow-hidden rounded-md border-4 border-amber-400 bg-zinc-800 shadow-xl shadow-amber-500/20">
                {top3[0].userImage ? (
                  <Image
                    src={top3[0].userImage}
                    alt={top3[0].userName || ""}
                    fill
                    className="object-cover"
                    unoptimized={!top3[0].userImage.startsWith("https://lh3.googleusercontent.com") && !top3[0].userImage.includes("supabase")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-lg text-amber-500">{(top3[0].userName || "U")[0]}</div>
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-sm bg-amber-400 p-1 text-black shadow-lg">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <div className="flex h-28 w-24 flex-col items-center justify-end rounded-t-sm bg-gradient-to-b from-amber-400/20 to-zinc-800 text-center shadow-[0_-4px_20px_rgba(251,191,36,0.15)]">
              <span className="mb-2 text-2xl font-black text-amber-400">1</span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <div className="relative h-12 w-12 overflow-hidden rounded-md border-2 border-amber-800 bg-zinc-800 shadow-md">
                {top3[2].userImage ? (
                  <Image
                    src={top3[2].userImage}
                    alt={top3[2].userName || ""}
                    fill
                    className="object-cover"
                    unoptimized={!top3[2].userImage.startsWith("https://lh3.googleusercontent.com") && !top3[2].userImage.includes("supabase")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-zinc-600">{(top3[2].userName || "U")[0]}</div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-sm bg-amber-800 px-1 py-0.5 text-[10px] font-black leading-none text-white shadow-sm">
                3
              </div>
            </div>
            <div className="h-14 w-14 rounded-t-sm bg-zinc-800 text-center shadow-inner">
              <div className="h-1 w-full bg-zinc-700/50" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.userId}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className={cn(
              "flex items-center gap-4 rounded-md border border-white/5 bg-zinc-900/50 p-3 transition-all hover:bg-zinc-800",
              index < 3 && "border-amber-400/20 bg-amber-400/5"
            )}
          >
            <div className="flex w-6 justify-center font-mono text-xs font-bold text-zinc-500">
              {(index + 1).toString().padStart(2, "0")}
            </div>

            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-sm bg-zinc-800">
              {entry.userImage ? (
                <Image
                  src={entry.userImage}
                  alt={entry.userName || "User"}
                  fill
                  className="object-cover"
                  unoptimized={!entry.userImage.startsWith("https://lh3.googleusercontent.com") && !entry.userImage.includes("supabase")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-500">
                  {(entry.userName || "U").charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className={cn("text-sm font-bold truncate text-white")}>{entry.userName || "Anonymous"}</p>
              {entry.topBadge && (
                <div className="relative group/badge">
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border",
                    entry.topBadge.rarity === "LEGENDARY" ? "border-amber-500 bg-amber-500/10 text-amber-500" :
                      entry.topBadge.rarity === "EPIC" ? "border-purple-500 bg-purple-500/10 text-purple-500" :
                        entry.topBadge.rarity === "RARE" ? "border-sky-500 bg-sky-500/10 text-sky-500" :
                          "border-zinc-700 bg-zinc-800 text-zinc-500"
                  )}>
                    {entry.topBadge.imageUrl ? (
                      <Image src={entry.topBadge.imageUrl} alt={entry.topBadge.name} width={10} height={10} className="object-cover" />
                    ) : (
                      <Trophy className="h-2 w-2" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 rounded-sm bg-zinc-800 px-2 py-1">
              <Coins className="h-3 w-3 text-amber-400" />
              <span className="font-mono text-sm font-bold text-white">{entry.totalPoints ?? entry.score ?? 0}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
