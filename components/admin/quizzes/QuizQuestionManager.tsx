"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Search } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAvailableQuestions } from "@/app/admin/quizzes/actions";

interface TopicOption {
  id: string;
  name: string;
  level: number;
}

interface QuizSummary {
  id: string;
  title: string;
}

interface PoolQuestion {
  poolId: string;
  questionId: string;
  order: number;
  points: number;
  question: {
    questionText: string;
    difficulty: string;
    answers: Array<{ id: string }>;
    topic: {
      id: string;
      name: string;
    } | null;
  };
}

interface QuestionListItem {
  id: string;
  questionText: string;
  difficulty: string;
  answers: Array<{ id: string }>;
  topic: {
    id: string;
    name: string;
  } | null;
}

interface QuizQuestionManagerProps {
  quiz: QuizSummary;
  initialPoolQuestions: PoolQuestion[];
  topics: TopicOption[];
}

function SortableQuestionRow({
  question,
  onRemove,
  onUpdatePoints,
}: {
  question: PoolQuestion;
  onRemove: (_poolId: string, _questionId: string) => void;
  onUpdatePoints: (_poolId: string, _points: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.poolId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{question.question.questionText}</div>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {question.question.topic?.name ?? "Unassigned"}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {question.question.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {question.question.answers.length} answers
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-20">
          <Input
            type="number"
            min="1"
            value={question.points}
            onChange={(event) => onUpdatePoints(question.poolId, Number(event.target.value))}
            className="h-8 text-sm"
          />
          <p className="mt-1 text-center text-xs text-muted-foreground">points</p>
        </div>

        <Button variant="ghost" size="sm" onClick={() => onRemove(question.poolId, question.questionId)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function QuizQuestionManager({
  quiz,
  initialPoolQuestions,
  topics,
}: QuizQuestionManagerProps) {
  const { toast } = useToast();
  const [poolQuestions, setPoolQuestions] = useState<PoolQuestion[]>(initialPoolQuestions);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionListItem[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLoadingAvailable, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadAvailableQuestions = useCallback(() => {
    const excludeIds = poolQuestions.map((question) => question.questionId);
    startTransition(async () => {
      try {
        const questions = await getAvailableQuestions({
          search: searchQuery,
          topicId: topicFilter || undefined,
          difficulty: (difficultyFilter as any) || undefined,
          excludeIds,
        });
        setAvailableQuestions(questions);
      } catch (error: any) {
        toast({
          title: "Unable to load questions",
          description: error.message || "An unexpected error occurred while loading questions.",
          variant: "destructive",
        });
      }
    });
  }, [difficultyFilter, poolQuestions, searchQuery, toast, topicFilter, startTransition]);

  useEffect(() => {
    if (addDialogOpen) {
      loadAvailableQuestions();
    }
  }, [addDialogOpen, loadAvailableQuestions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setPoolQuestions((questions) => {
      const oldIndex = questions.findIndex((item) => item.poolId === active.id);
      const newIndex = questions.findIndex((item) => item.poolId === over.id);
      const reordered = arrayMove(questions, oldIndex, newIndex);

      return reordered.map((item, index) => ({
        ...item,
        order: index + 1,
      }));
    });
  };

  const handleAddQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/quizzes/${quiz.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add question");
      }

      const newEntry = result.data;

      setPoolQuestions((prev) => [
        ...prev,
        {
          poolId: newEntry.id,
          questionId: newEntry.questionId,
          order: newEntry.order,
          points: newEntry.points,
          question: newEntry.question,
        },
      ]);

      toast({
        title: "Question added!",
        description: "Question has been added to the quiz.",
      });

      setAddDialogOpen(false);
      setSearchQuery("");
      setTopicFilter("");
      setDifficultyFilter("");
      setAvailableQuestions([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveQuestion = async (poolId: string, _questionId: string) => {
    // Optimistic update
    setPoolQuestions((prev) => prev.filter((question) => question.poolId !== poolId));

    try {
      const response = await fetch(
        `/api/admin/quizzes/${quiz.id}/questions/${poolId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove question");
      }

      toast({
        title: "Question removed",
        description: "Question has been removed from the quiz.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing question",
        description: error.message + " - Refresh the page to see current state.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePoints = (poolId: string, points: number) => {
    if (Number.isNaN(points) || points <= 0) {
      return;
    }

    // Local update only - saved via "Save Order & Points" button
    setPoolQuestions((prev) =>
      prev.map((question) => (question.poolId === poolId ? { ...question, points } : question))
    );
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/quizzes/${quiz.id}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: poolQuestions.map((question) => ({
            questionId: question.questionId,
            order: question.order,
            points: question.points,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save changes");
      }

      toast({
        title: "Changes saved!",
        description: "Question order and points have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Manage Questions: ${quiz.title}`}
        description="Add, remove, and reorder questions in this quiz"
        action={
          <div className="flex gap-2">
            <Button onClick={handleSaveOrder} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Order & Points"}
            </Button>
            <Link href={`/admin/quizzes/${quiz.id}/edit`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quiz
              </Button>
            </Link>
          </div>
        }
      />

      {poolQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No questions in this quiz yet.</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Questions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {poolQuestions.length} question(s) • Drag to reorder • Adjust points per question
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Questions
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={poolQuestions.map((question) => question.poolId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {poolQuestions.map((question) => (
                  <SortableQuestionRow
                    key={question.poolId}
                    question={question}
                    onRemove={handleRemoveQuestion}
                    onUpdatePoints={handleUpdatePoints}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Questions to Quiz</DialogTitle>
            <DialogDescription>Select questions from the question pool to add to this quiz.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search-questions">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-questions"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={topicFilter || "all"} onValueChange={(value) => setTopicFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {"— ".repeat(topic.level ?? 0)}
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={difficultyFilter || "all"}
                onValueChange={(value) => setDifficultyFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border">
            {isLoadingAvailable ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                {searchQuery || topicFilter || difficultyFilter
                  ? "No questions match your filters"
                  : "No available questions"}
              </div>
            ) : (
              <div className="divide-y">
                {availableQuestions.map((question) => (
                  <div key={question.id} className="transition-colors hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{question.questionText}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {question.topic?.name ?? "Unassigned"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {question.answers.length} answers
                          </span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleAddQuestion(question.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
