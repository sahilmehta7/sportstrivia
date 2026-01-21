"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/shared/PageContainer";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { Search, Grid, List, Zap, ShieldCheck, Activity, ChevronRight, Sparkles, Filter, Database, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { Badge } from "@/components/ui/badge";

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  href: string;
  accentDark: string;
  accentLight: string;
  quizCount?: number;
}

interface TopicsContentProps {
  featured: TopicItem[];
  topics: TopicItem[];
  l2TopicsByParent: Record<string, TopicItem[]>;
  suggestedChips: { value: string; label: string }[];
}

export function TopicsContent({ featured, topics, l2TopicsByParent, suggestedChips }: TopicsContentProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "featured">("all");

  const filteredTopics = useMemo(() => {
    if (!search) return topics;
    const s = search.toLowerCase();
    return topics.filter(t => t.title.toLowerCase().includes(s) || (t.description?.toLowerCase().includes(s)));
  }, [topics, search]);

  const { circle1, circle2, circle3 } = getBlurCircles();

  return (
    <ShowcaseThemeProvider>
      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10">{circle1}{circle2}{circle3}</div>

        <PageContainer className="space-y-20">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10 pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h1 className={cn("text-5xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.8]", getGradientText("neon"))}>
                  SECTORS
                </h1>
              </div>
            </div>

            <div className="max-w-md w-full">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="RESOLVE SECTOR IDENTIFIER..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-14 pl-12 rounded-2xl glass border-white/10 text-[10px] font-black tracking-widest uppercase placeholder:text-white/10 focus:border-primary/40 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Featured Grid */}
          {!search && featured.length > 0 && (
            <section className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-4 w-1 rounded-full bg-secondary shadow-neon-magenta" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Priority Assignments</h2>
                <Badge variant="neon" className="px-2 py-0 text-[8px] tracking-widest uppercase h-4">HOT</Badge>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((t) => (
                  <Link key={t.id} href={t.href}>
                    <div className="group relative h-full overflow-hidden rounded-[2.5rem] glass-elevated border border-white/5 p-8 transition-all hover:bg-white/5 hover:border-primary/20 hover:scale-[1.02]">
                      <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-1 rounded-full bg-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">ACTIVE</span>
                          </div>
                          <h3 className="text-3xl font-black uppercase tracking-tighter group-hover:text-primary transition-colors">{t.title}</h3>
                          <p className="text-xs font-bold tracking-wide text-muted-foreground/60 uppercase line-clamp-2">{t.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl glass border border-white/5 flex items-center justify-center">
                              <Database className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-[10px] font-black tracking-widest uppercase">{t.quizCount ?? 0} DATASETS</div>
                          </div>
                          <div className="h-10 w-10 rounded-full glass border border-white/5 flex items-center justify-center group-hover:border-primary/40 group-hover:text-primary transition-all">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <Sparkles className="h-32 w-32" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Sectors Grid */}
          <section className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-4 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Index Matrix</h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredTopics.map((t) => (
                <Link key={t.id} href={t.href}>
                  <div className="group relative overflow-hidden rounded-[2rem] glass p-6 border border-white/5 transition-all hover:bg-white/5 hover:border-primary/20">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <h4 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors truncate max-w-[150px]">{t.title}</h4>
                        <div className="flex items-center gap-3">
                          <Badge variant="glass" className="text-[8px] tracking-[0.2em] font-black px-1.5 py-0 bg-white/5 border-white/5">{t.quizCount ?? 0} PACKS</Badge>
                        </div>
                      </div>
                      <TrendingUp className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </PageContainer>

        {/* Tactical decor */}
        <div className="absolute top-1/2 -right-40 pointer-events-none opacity-[0.02]">
          <Grid className="h-[600px] w-[600px]" />
        </div>
      </main>
    </ShowcaseThemeProvider>
  );
}
