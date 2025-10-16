"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface QuizQuestionPageProps {
  params: Promise<{ id: string }>;
}

function SortableQuestionRow({ question, onRemove, onUpdatePoints }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.poolId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-card border rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{question.question.questionText}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {question.question.topic.name}
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
            onChange={(e) => onUpdatePoints(question.poolId, parseInt(e.target.value))}
            className="h-8 text-sm"
          />
          <p className="text-xs text-muted-foreground text-center mt-1">points</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(question.poolId, question.questionId)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function QuizQuestionsPage({ params }: QuizQuestionPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quizId, setQuizId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [poolQuestions, setPoolQuestions] = useState<any[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [topics, setTopics] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function init() {
      const resolvedParams = await params;
      setQuizId(resolvedParams.id);
      await loadQuiz(resolvedParams.id);
      await loadTopics();
    }
    init();
  }, [params]);

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      const result = await response.json();
      if (response.ok) {
        setTopics(result.data.topics);
      }
    } catch (error) {
      console.error("Failed to load topics:", error);
    }
  };

  const loadQuiz = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quizzes/${id}/questions`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load quiz");
      }

      setQuiz(result.data.quiz);
      setPoolQuestions(result.data.questions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      router.push("/admin/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableQuestions = async () => {
    try {
      const params = new URLSearchParams({
        limit: "100",
        ...(searchQuery && { search: searchQuery }),
        ...(topicFilter && { topicId: topicFilter }),
        ...(difficultyFilter && { difficulty: difficultyFilter }),
      });

      const response = await fetch(`/api/admin/questions?${params}`);
      const result = await response.json();

      if (response.ok) {
        // Filter out questions already in pool
        const poolQuestionIds = new Set(poolQuestions.map(q => q.questionId));
        const available = result.data.questions.filter(
          (q: any) => !poolQuestionIds.has(q.id)
        );
        setAvailableQuestions(available);
      }
    } catch (error) {
      console.error("Failed to load questions:", error);
    }
  };

  useEffect(() => {
    if (addDialogOpen) {
      loadAvailableQuestions();
    }
  }, [addDialogOpen, searchQuery, topicFilter, difficultyFilter, poolQuestions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPoolQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.poolId === active.id);
        const newIndex = items.findIndex((item) => item.poolId === over.id);
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Update order numbers
        return reordered.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
    }
  };

  const handleAddQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add question");
      }

      toast({
        title: "Question added!",
        description: "Question has been added to the quiz.",
      });

      await loadQuiz(quizId);
      setAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveQuestion = async (poolId: string, questionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/quizzes/${quizId}/questions?questionId=${questionId}`,
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

      setPoolQuestions((prev) => prev.filter((q) => q.poolId !== poolId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePoints = (poolId: string, points: number) => {
    setPoolQuestions((prev) =>
      prev.map((q) => (q.poolId === poolId ? { ...q, points } : q))
    );
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: poolQuestions.map((q) => ({
            questionId: q.questionId,
            order: q.order,
            points: q.points,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save order");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Manage Questions: ${quiz?.title}`}
        description="Add, remove, and reorder questions in this quiz"
        action={
          <div className="flex gap-2">
            <Button onClick={handleSaveOrder} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Order & Points"}
            </Button>
            <Link href={`/admin/quizzes/${quizId}/edit`}>
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
            <p className="text-muted-foreground mb-4">
              No questions in this quiz yet.
            </p>
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={poolQuestions.map((q) => q.poolId)}
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

      {/* Add Question Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Questions to Quiz</DialogTitle>
            <DialogDescription>
              Select questions from the question pool to add to this quiz
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search-questions">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-questions"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Select
                value={topicFilter || "all"}
                onValueChange={(val) => setTopicFilter(val === "all" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {"  ".repeat(topic.level)}
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
                onValueChange={(val) => setDifficultyFilter(val === "all" ? "" : val)}
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

          {/* Available Questions List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {availableQuestions.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                {searchQuery || topicFilter || difficultyFilter
                  ? "No questions match your filters"
                  : "No available questions"}
              </div>
            ) : (
              <div className="divide-y">
                {availableQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{question.questionText}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {question.topic.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {question.answers.length} answers
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddQuestion(question.id)}
                      >
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

