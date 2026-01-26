"use client";

import Image from "next/image";
import type { QuizResultsLeaderboardProps } from "./types";
import { cn } from "@/lib/utils";
import { getTextColor } from "@/lib/showcase-theme";
import { Coins, Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

export function QuizResultsLeaderboard({
  entries,
  theme,
}: QuizResultsLeaderboardProps) {
  if (!entries.length) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-6 text-center text-sm",
          theme === "light"
            ? "border-slate-200/50 bg-white/60 text-slate-600"
            : "border-white/10 bg-white/5 text-white/70",
        )}
      >
        Leaderboard data is not available yet.
      </div>
    );
  }

  const top3 = entries.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Podium Section */}
      <div className="flex items-end justify-center gap-2 pb-4 pt-8 sm:gap-4">
        {/* 2nd Place */}
        {top3[1] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-slate-300 bg-slate-100 sm:h-16 sm:w-16 relative">
                {top3[1].userImage ? (
                  <Image
                    src={top3[1].userImage}
                    alt={top3[1].userName || ""}
                    fill
                    className="object-cover"
                    unoptimized={!top3[1].userImage.startsWith("https://lh3.googleusercontent.com") && !top3[1].userImage.includes("supabase")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold">{(top3[1].userName || "U")[0]}</div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-slate-300 p-1 text-slate-700 shadow-sm">
                <Medal className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="h-16 w-16 rounded-t-lg bg-slate-200/50 text-center dark:bg-slate-700/50 sm:h-20 sm:w-20">
              <span className="text-xs font-black">2ND</span>
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-16 w-16 overflow-hidden rounded-full border-4 border-amber-400 bg-amber-50 sm:h-20 sm:w-20 relative"
              >
                {top3[0].userImage ? (
                  <Image
                    src={top3[0].userImage}
                    alt={top3[0].userName || ""}
                    fill
                    className="object-cover"
                    unoptimized={!top3[0].userImage.startsWith("https://lh3.googleusercontent.com") && !top3[0].userImage.includes("supabase")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-lg text-amber-700">{(top3[0].userName || "U")[0]}</div>
                )}
              </motion.div>
              <div className="absolute -bottom-2 -right-2 rounded-full bg-amber-400 p-1.5 text-black shadow-lg">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="h-24 w-20 rounded-t-lg bg-amber-400/20 text-center dark:bg-amber-400/10 sm:h-28 sm:w-24">
              <span className="text-sm font-black text-amber-600">1ST</span>
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
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-amber-700/50 bg-orange-50 sm:h-14 sm:w-14 relative">
                {top3[2].userImage ? (
                  <Image
                    src={top3[2].userImage}
                    alt={top3[2].userName || ""}
                    fill
                    className="object-cover"
                    unoptimized={!top3[2].userImage.startsWith("https://lh3.googleusercontent.com") && !top3[2].userImage.includes("supabase")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold">{(top3[2].userName || "U")[0]}</div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-700/50 p-1 text-white shadow-sm">
                <Medal className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="h-12 w-14 rounded-t-lg bg-amber-700/10 text-center dark:bg-amber-700/5 sm:h-16 sm:w-18">
              <span className="text-[10px] font-black opacity-60">3RD</span>
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
              "flex items-center gap-3 rounded-2xl border p-3 transition-all",
              theme === "light"
                ? "border-slate-200/50 bg-white shadow-sm hover:shadow-md"
                : "border-white/10 bg-white/5 hover:bg-white/10",
              index < 3 && "bg-primary/5 dark:bg-white/10 border-primary/20 dark:border-white/20"
            )}
          >
            <div className="flex w-6 justify-center text-xs font-black opacity-40">
              {(index + 1).toString().padStart(2, "0")}
            </div>

            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10 relative">
              {entry.userImage ? (
                <Image
                  src={entry.userImage}
                  alt={entry.userName || "User"}
                  fill
                  className="object-cover"
                  unoptimized={!entry.userImage.startsWith("https://lh3.googleusercontent.com") && !entry.userImage.includes("supabase")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                  {(entry.userName || "U").charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className={cn("text-sm font-bold truncate", getTextColor("primary"))}>{entry.userName || "Anonymous"}</p>
              {entry.topBadge && (
                <div className="relative group/badge">
                  <div className={cn(
                    "h-5 w-5 rounded-full border flex items-center justify-center bg-black/5",
                    entry.topBadge.rarity === "LEGENDARY" ? "border-amber-500 bg-amber-500/10 text-amber-500" :
                      entry.topBadge.rarity === "EPIC" ? "border-purple-500 bg-purple-500/10 text-purple-500" :
                        entry.topBadge.rarity === "RARE" ? "border-sky-500 bg-sky-500/10 text-sky-500" :
                          "border-slate-300 bg-slate-100 text-slate-400"
                  )}>
                    {entry.topBadge.imageUrl ? (
                      <Image src={entry.topBadge.imageUrl} alt={entry.topBadge.name} width={16} height={16} className="object-cover" />
                    ) : (
                      <Trophy className="h-3 w-3" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/5 dark:bg-white/5">
              <Coins className="h-3 w-3 text-amber-500" />
              <span className="text-sm font-black tracking-tight">{entry.totalPoints ?? entry.score ?? 0}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
