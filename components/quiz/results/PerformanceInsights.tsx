"use client";

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Clock, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceInsightsProps {
    userAnswers: Array<{
        id: string;
        isCorrect: boolean;
        timeSpent: number;
        question: {
            questionText: string;
        };
    }>;
    className?: string;
}

export function PerformanceInsights({ userAnswers, className }: PerformanceInsightsProps) {
    const chartData = useMemo(() => {
        return userAnswers.map((ua, index) => ({
            name: `Q${index + 1}`,
            time: ua.timeSpent,
            isCorrect: ua.isCorrect,
            fullText: ua.question.questionText,
        }));
    }, [userAnswers]);

    const averageTime = useMemo(() => {
        if (userAnswers.length === 0) return 0;
        return userAnswers.reduce((sum, ua) => sum + ua.timeSpent, 0) / userAnswers.length;
    }, [userAnswers]);

    const accuracy = useMemo(() => {
        if (userAnswers.length === 0) return 0;
        return (userAnswers.filter((ua) => ua.isCorrect).length / userAnswers.length) * 100;
    }, [userAnswers]);

    return (
        <div className={cn("space-y-6", className)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-primary/10 bg-primary/5 p-4"
                >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/60">
                        <Clock className="h-3 w-3" />
                        Speed Accuracy
                    </div>
                    <div className="mt-2 text-2xl font-black">{averageTime.toFixed(1)}s</div>
                    <div className="text-[10px] font-medium opacity-60">Avg. time per question</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4"
                >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600/60">
                        <Target className="h-3 w-3" />
                        Precision
                    </div>
                    <div className="mt-2 text-2xl font-black text-emerald-600">{accuracy.toFixed(0)}%</div>
                    <div className="text-[10px] font-medium opacity-60">Overall accuracy rate</div>
                </motion.div>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-white p-6 shadow-sm dark:bg-white/5">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Response Time Analysis
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold uppercase opacity-60">Correct</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-bold uppercase opacity-60">Incorrect</span>
                        </div>
                    </div>
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700 }}
                                unit="s"
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border bg-white p-3 shadow-xl dark:bg-slate-900">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Question {data.name}</p>
                                                <p className="mt-1 text-xs font-bold leading-tight">{data.fullText}</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className={cn(
                                                        "rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-white",
                                                        data.isCorrect ? "bg-emerald-500" : "bg-rose-500"
                                                    )}>
                                                        {data.isCorrect ? "Correct" : "Incorrect"}
                                                    </span>
                                                    <span className="text-xs font-bold">{data.time}s</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isCorrect ? "#10b981" : "#ef4444"}
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
