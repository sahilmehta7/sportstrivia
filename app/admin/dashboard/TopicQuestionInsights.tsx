"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Difficulty } from "@prisma/client";

type TopicQuestionInsightTopic = {
  id: string;
  name: string;
  questionCount: number;
};

type TopicQuestionInsightQuestion = {
  id: string;
  topicId: string;
  questionText: string;
  difficulty: Difficulty;
};

interface TopicQuestionInsightsProps {
  topics: TopicQuestionInsightTopic[];
  questionsByTopic: Record<string, TopicQuestionInsightQuestion[]>;
}

const DIFFICULTIES: Array<Difficulty | "ALL"> = ["ALL", "EASY", "MEDIUM", "HARD"];

export function TopicQuestionInsights({ topics, questionsByTopic }: TopicQuestionInsightsProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "ALL">("ALL");

  const maxQuestionCount = useMemo(
    () => topics.reduce((max, topic) => Math.max(max, topic.questionCount), 0),
    [topics]
  );

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? null,
    [topics, selectedTopicId]
  );

  const filteredQuestions = useMemo(() => {
    const source = questionsByTopic[selectedTopicId] ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    return source.filter((question) => {
      const passesDifficulty = difficulty === "ALL" || question.difficulty === difficulty;
      const passesSearch =
        normalizedSearch.length === 0 ||
        question.questionText.toLowerCase().includes(normalizedSearch);

      return passesDifficulty && passesSearch;
    });
  }, [difficulty, questionsByTopic, search, selectedTopicId]);

  if (topics.length === 0) {
    return (
      <div className="rounded-3xl glass border border-white/5 p-8">
        <h2 className="text-2xl font-black uppercase tracking-tight">Question Insights</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No topics with questions yet.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl glass border border-white/5 p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black uppercase tracking-tight">Question Insights</h2>
        <p className="text-sm text-muted-foreground">
          Explore question count by topic and preview recent questions instantly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Questions by Topic
          </h3>
          <div className="max-h-[28rem] overflow-y-auto space-y-2 pr-2">
            {topics.map((topic) => {
              const widthPercent =
                maxQuestionCount > 0
                  ? Math.max(8, Math.round((topic.questionCount / maxQuestionCount) * 100))
                  : 8;

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(topic.id)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-left p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold truncate">{topic.name}</span>
                    <Badge variant={selectedTopicId === topic.id ? "neon" : "outline"}>
                      {topic.questionCount}
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-primary/80"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">
                {selectedTopic?.name ?? "Topic"} Questions
              </h3>
              <p className="text-xs text-muted-foreground">
                Showing up to {questionsByTopic[selectedTopicId]?.length ?? 0} most recent questions
              </p>
            </div>
            {selectedTopicId ? (
              <Link href={`/admin/questions?topicId=${selectedTopicId}`}>
                <Button size="sm" variant="outline">Open Full List</Button>
              </Link>
            ) : null}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search in selected topic..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((difficultyValue) => (
              <Button
                key={difficultyValue}
                type="button"
                size="sm"
                variant={difficulty === difficultyValue ? "default" : "outline"}
                onClick={() => setDifficulty(difficultyValue)}
              >
                {difficultyValue}
              </Button>
            ))}
          </div>

          <div className="max-h-[28rem] overflow-y-auto space-y-2 pr-2">
            {filteredQuestions.length === 0 ? (
              <div className="rounded-xl border border-white/10 p-4 text-sm text-muted-foreground">
                No questions match the current filters.
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed line-clamp-2">
                      {question.questionText}
                    </p>
                    <Badge variant="secondary" className="shrink-0">
                      {question.difficulty}
                    </Badge>
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/admin/questions/${question.id}/edit`}>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
