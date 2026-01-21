import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Users, Trophy, TrendingUp, Activity, Database, Zap, ShieldCheck, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

export default async function AdminDashboard() {
  const [totalUsers, totalQuizzes, totalQuestions, totalAttempts, recentQuizzes] =
    await Promise.all([
      prisma.user.count(),
      prisma.quiz.count({ where: { isPublished: true } }),
      prisma.question.count(),
      prisma.quizAttempt.count({ where: { completedAt: { not: null } } }),
      prisma.quiz.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              attempts: true,
              questionPool: true,
            },
          },
        },
      }),
    ]);

  const totalStarted = await prisma.quizAttempt.count();
  const completionRate = totalStarted > 0 ? (totalAttempts / totalStarted) * 100 : 0;

  const stats = [
    { title: "USER BASE", value: totalUsers.toLocaleString(), icon: Users, desc: "IDENTIFIED ENTITIES", color: "primary" },
    { title: "ACTIVE ARENAS", value: totalQuizzes.toLocaleString(), icon: FileQuestion, desc: "PUBLISHED REGIONS", color: "secondary" },
    { title: "DATA POOL", value: totalQuestions.toLocaleString(), icon: Database, desc: "COMPILED QUERIES", color: "primary" },
    { title: "SYNC RADIUS", value: `${completionRate.toFixed(1)}%`, icon: Activity, desc: "SUCCESS VECTORS", color: "secondary" },
  ];

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-primary shadow-neon-cyan" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">TELEMETRY OVERVIEW</span>
        </div>
        <h1 className={cn("text-5xl lg:text-7xl font-black uppercase tracking-tighter", getGradientText("neon"))}>
          DASHBOARD
        </h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="relative group">
            <div className={cn(
              "absolute -inset-0.5 blur-xl opacity-0 transition-opacity rounded-[2rem]",
              stat.color === "primary" ? "bg-primary/20 group-hover:opacity-100" : "bg-secondary/20 group-hover:opacity-100"
            )} />
            <div className="relative overflow-hidden rounded-[2rem] glass-elevated border border-white/5 p-8 transition-all group-hover:bg-white/5">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl glass border flex items-center justify-center transition-all",
                    stat.color === "primary" ? "border-primary/20 text-primary" : "border-secondary/20 text-secondary"
                  )}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <Zap className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black tracking-tighter uppercase">{stat.value}</div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black tracking-widest uppercase">{stat.title}</div>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">{stat.desc}</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
                <stat.icon className="h-20 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="relative h-full overflow-hidden rounded-[3rem] glass-elevated border border-white/5 p-10 space-y-10 group-hover:bg-white/5 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Mission Pipeline</h2>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-60">RECENTLY BROADCASTED ARENAS</p>
              </div>
              <Button variant="glass" size="sm" className="rounded-xl border-white/5 text-[10px] font-black uppercase tracking-widest">VIEW ALL</Button>
            </div>

            <div className="space-y-4">
              {recentQuizzes.map((quiz) => (
                <div key={quiz.id} className="group/item relative overflow-hidden rounded-2xl glass border border-white/5 p-5 transition-all hover:bg-white/5 hover:border-white/10">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 min-w-0 flex items-center gap-5">
                      <div className="h-12 w-12 rounded-xl glass border border-white/5 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6 text-primary/40 group-hover/item:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0 group-hover/item:translate-x-1 transition-transform">
                        <h3 className="text-sm font-black uppercase tracking-tight truncate">{quiz.title}</h3>
                        <div className="flex items-center gap-3 mt-1 opacity-40">
                          <span className="text-[10px] font-black tracking-widest uppercase">{quiz._count.questionPool} NODES</span>
                          <div className="h-1 w-1 rounded-full bg-white/20" />
                          <span className="text-[10px] font-black tracking-widest uppercase">{quiz._count.attempts} SYNCED</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge variant={quiz.status === "PUBLISHED" ? "neon" : "glass"} className="px-2 py-0 text-[8px] tracking-widest uppercase">
                        {quiz.status}
                      </Badge>
                      <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-40">{quiz.difficulty}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentQuizzes.length === 0 && (
                <div className="py-20 text-center space-y-4 opacity-40">
                  <Activity className="h-10 w-10 mx-auto" />
                  <p className="text-[10px] font-black tracking-widest uppercase">NO ACTIVE TRANSMISSIONS</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-secondary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]" />
          <div className="relative h-full overflow-hidden rounded-[3rem] glass border border-white/5 p-10 flex flex-col justify-between group-hover:bg-white/5 transition-all">
            <div className="space-y-8">
              <div className="h-16 w-16 rounded-[1.5rem] glass border border-secondary/20 flex items-center justify-center text-secondary shadow-neon-magenta/20">
                <Trophy className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-tight">Arena Statistics</h3>
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase leading-relaxed">COMPILED PERFORMANCE METRICS ACROSS ALL OPERATIONAL SECTORS</p>
              </div>
            </div>

            <div className="space-y-6 pt-10">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-4">
                <span className="text-muted-foreground">Global Engagement</span>
                <span className="text-primary">+12.4%</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-4">
                <span className="text-muted-foreground">Resource Nodes</span>
                <span className="text-primary">{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground">Active Identifiers</span>
                <span className="text-primary">{totalUsers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
