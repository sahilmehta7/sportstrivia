"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Users, BookOpen, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { TopicSummary } from "@/types/home";

interface TopTopicsResponse {
  topics: TopicSummary[];
  sortBy: string;
  limit: number;
  total: number;
}

interface ShowcaseTopTopicsProps {
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  defaultSortBy?: "users" | "quizzes";
  limit?: number;
  className?: string;
  initialTopics?: TopicSummary[];
}

const topicIcons: Record<string, string> = {
  "default": "🏆",
};

const neonAccents = [
  { border: "border-primary/20", glow: "shadow-neon-cyan/20", text: "text-primary", bg: "bg-primary/5" },
  { border: "border-secondary/20", glow: "shadow-neon-magenta/20", text: "text-secondary", bg: "bg-secondary/5" },
  { border: "border-accent/20", glow: "shadow-neon-lime/20", text: "text-accent", bg: "bg-accent/5" },
];

export function ShowcaseTopTopics({
  title,
  showViewAll = true,
  viewAllHref = "/topics",
  defaultSortBy = "users",
  limit = 6,
  className,
  initialTopics,
}: ShowcaseTopTopicsProps) {
  const initialTopicsProvided = Array.isArray(initialTopics) && initialTopics.length > 0;
  const [topics, setTopics] = useState<TopicSummary[]>(initialTopics ?? []);
  const [sortBy, setSortBy] = useState<"users" | "quizzes">(defaultSortBy);
  const [loading, setLoading] = useState(!initialTopicsProvided);
  const hydratedInitialRef = useRef(false);

  useEffect(() => {
    if (!hydratedInitialRef.current) {
      hydratedInitialRef.current = true;
      if (initialTopicsProvided && sortBy === defaultSortBy) {
        setLoading(false);
        return;
      }
    }

    let ignore = false;
    const fetchTopTopics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/topics/top?sortBy=${sortBy}&limit=${limit}`);
        if (!response.ok) throw new Error(`Failed to fetch topics`);
        const data: TopTopicsResponse = await response.json();
        if (!ignore) setTopics(data.topics ?? []);
      } catch (err) {
        console.error("Failed to fetch topics", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void fetchTopTopics();
    return () => { ignore = true; };
  }, [sortBy, limit, initialTopicsProvided, defaultSortBy]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {title && (
          <h2 className="text-2xl font-black tracking-tight uppercase">{title}</h2>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="glass-elevated border-white/10 h-11 min-w-[160px] font-bold uppercase tracking-widest text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-elevated border-white/10">
              <SelectItem value="users" className="font-bold uppercase tracking-widest text-[10px]">Top Players</SelectItem>
              <SelectItem value="quizzes" className="font-bold uppercase tracking-widest text-[10px]">Massive Libraries</SelectItem>
            </SelectContent>
          </Select>

          {showViewAll && (
            <Button asChild variant="glass" size="lg" className="h-11 font-black uppercase tracking-widest text-[10px]">
              <Link href={viewAllHref}>Explore All</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic, index) => {
          const accent = neonAccents[index % neonAccents.length];

          return (
            <Link key={topic.id} href={`/topics/${topic.slug}`} className="group block">
              <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                "glass-elevated border-white/5 hover:border-white/10 hover:-translate-y-2 hover:shadow-glass-lg",
                accent.glow
              )}>
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className={cn(
                      "relative h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl",
                      "glass border-white/10 shadow-sm",
                      "group-hover:scale-110 transition-transform duration-300"
                    )}>
                      {topic.imageUrl ? (
                        <Image src={topic.imageUrl} alt={topic.name} fill className="rounded-2xl object-cover p-1" />
                      ) : (
                        <span>{topicIcons.default}</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black tracking-tight leading-none group-hover:text-primary transition-colors">
                          {topic.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                          {topic.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <Users className={cn("h-3 w-3", accent.text)} />
                          {topic.userCount.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <BookOpen className={cn("h-3 w-3", accent.text)} />
                          {topic.quizCount} Quizzes
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className={cn("absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500", accent.bg.replace('/5', ''))} />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
