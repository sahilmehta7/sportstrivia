"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ExpirationTimer } from "./ExpirationTimer";
import { Trophy, Swords, CheckCircle2, Zap, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

interface ChallengeCardProps {
  challenge: {
    id: string;
    quizId: string;
    quiz: { title: string; slug: string; difficulty: string };
    challenger: { id: string; name: string | null; image: string | null };
    challenged: { id: string; name: string | null; image: string | null };
    challengerScore: number | null;
    challengedScore: number | null;
    status: string;
    expiresAt?: string | null;
    createdAt: string;
  };
  currentUserId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onViewResults?: () => void;
}

export function ChallengeCard({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onViewResults,
}: ChallengeCardProps) {
  const isChallenger = currentUserId === challenge.challenger.id;
  const isChallenged = currentUserId === challenge.challenged.id;
  const bothCompleted = challenge.challengerScore !== null && challenge.challengedScore !== null;

  const getStatusConfig = () => {
    switch (challenge.status) {
      case "PENDING":
        return { label: "PENDING SIGNAL", color: "text-amber-400", border: "border-amber-500/20" };
      case "ACCEPTED":
        return { label: "ENGAGED", color: "text-primary", border: "border-primary/20" };
      case "COMPLETED":
        return { label: "MISSION ARCHIVED", color: "text-emerald-400", border: "border-emerald-500/20" };
      case "DECLINED":
        return { label: "SEVERED", color: "text-red-400", border: "border-red-500/20" };
      case "EXPIRED":
        return { label: "SIGNAL LOST", color: "text-muted-foreground", border: "border-white/10" };
      default:
        return { label: challenge.status, color: "text-white", border: "border-white/10" };
    }
  };

  const status = getStatusConfig();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(challenge.createdAt));

  return (
    <div className="relative group">
      <div className={cn(
        "relative overflow-hidden rounded-[2.5rem] border p-8 glass-elevated shadow-glass transition-all duration-300 group-hover:bg-white/5 group-hover:border-white/20",
      )}>
        {/* Header / Status */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl glass border border-white/5 flex items-center justify-center text-primary shadow-neon-cyan/10">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">CHALLENGE PROTOCOL</div>
              <div className={cn("text-xs font-black uppercase tracking-widest", status.color)}>{status.label}</div>
            </div>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent mx-6 hidden sm:block" />
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{formattedDate}</div>
        </div>

        {/* Battle Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-10">

          {/* Challenger */}
          <PlayerBlock
            user={challenge.challenger}
            score={challenge.challengerScore}
            isYou={isChallenger}
            label="COMMANDER"
            glowColor="cyan"
          />

          {/* VS Divider */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-2xl glass border border-white/20 flex items-center justify-center shadow-lg transform rotate-45 group-hover:rotate-[135deg] transition-transform duration-700">
              <span className="text-sm font-black text-primary transform -rotate-45 group-hover:-rotate-[135deg] transition-transform duration-700">VS</span>
            </div>
            <div className="h-12 w-px bg-gradient-to-b from-white/10 to-transparent hidden lg:block" />
          </div>

          {/* Challenged */}
          <PlayerBlock
            user={challenge.challenged}
            score={challenge.challengedScore}
            isYou={isChallenged}
            label="OPPONENT"
            glowColor="magenta"
          />
        </div>

        {/* Quiz Info Bar */}
        <Link href={`/quizzes/${challenge.quiz.slug}`} className="block mt-10">
          <div className="relative overflow-hidden rounded-2xl p-5 glass border border-white/5 group-hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">{challenge.quiz.title}</h4>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{challenge.quiz.difficulty} SECTOR</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
        </Link>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 pt-8 border-t border-white/5">
          <div className="flex items-center gap-4 text-muted-foreground">
            {challenge.status === "PENDING" && challenge.expiresAt ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/5 text-[10px] font-bold tracking-widest uppercase text-amber-400">
                <Clock className="h-3 w-3" />
                <ExpirationTimer expiresAt={challenge.expiresAt} />
              </div>
            ) : (
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">TRANSMISSION STYLED SECURE</div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {challenge.status === "PENDING" && isChallenged && (
              <>
                {onAccept && (
                  <Button variant="neon" size="sm" onClick={onAccept} className="flex-1 sm:flex-none">
                    ACCEPT MISSION
                  </Button>
                )}
                {onDecline && (
                  <Button variant="glass" size="sm" onClick={onDecline} className="flex-1 sm:flex-none">
                    DECLINE
                  </Button>
                )}
              </>
            )}

            {challenge.status === "ACCEPTED" && (
              <>
                {((isChallenger && challenge.challengerScore === null) || (isChallenged && challenge.challengedScore === null)) ? (
                  <Link href={`/quizzes/${challenge.quiz.slug}/play`} className="w-full sm:w-auto">
                    <Button variant="neon" size="sm" className="w-full">
                      COMMENCE BATTLE
                    </Button>
                  </Link>
                ) : (
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">WAITING FOR TARGET...</div>
                )}
              </>
            )}

            {bothCompleted && onViewResults && (
              <Button variant="neon" size="sm" onClick={onViewResults} className="w-full sm:w-auto">
                <Trophy className="mr-2 h-3.5 w-3.5" />
                REVEAL DATA
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerBlock({ user, score, isYou, label, glowColor }: { user: any, score: number | null, isYou: boolean, label: string, glowColor: "cyan" | "magenta" }) {
  const glowClasses = glowColor === "cyan" ? "shadow-neon-cyan/20 border-cyan-500/20" : "shadow-neon-magenta/20 border-magenta-500/20";
  const textGlow = glowColor === "cyan" ? "text-cyan-400" : "text-magenta-400";

  return (
    <div className="flex items-center gap-6 lg:flex-row flex-col text-center lg:text-left">
      <div className={cn("relative p-1 rounded-2xl glass border shadow-glass", glowClasses)}>
        <UserAvatar src={user.image} alt={user.name || "Player"} size="lg" className="h-20 w-20 rounded-xl" />
        {score !== null && (
          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg glass border border-white/20 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</div>
        <h4 className="text-xl font-black uppercase tracking-tighter truncate max-w-[150px]">
          {isYou ? "YOU" : user.name || "UNIDENTIFIED"}
        </h4>
        {score !== null ? (
          <div className={cn("text-2xl font-black tracking-tighter", textGlow)}>
            {Math.round(score)}% <span className="text-[10px] tracking-widest uppercase text-muted-foreground/40 font-bold ml-1">SCORE</span>
          </div>
        ) : (
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">CALCULATING...</div>
        )}
      </div>
    </div>
  );
}
