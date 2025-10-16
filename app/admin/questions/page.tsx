"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function QuestionsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  // Filters
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [pagination.page, search, topicFilter, difficultyFilter]);

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

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(topicFilter && { topicId: topicFilter }),
        ...(difficultyFilter && { difficulty: difficultyFilter }),
      });

      const response = await fetch(`/api/admin/questions?${params}`);
      const result = await response.json();

      if (response.ok) {
        setQuestions(result.data.questions);
        setPagination(result.data.pagination);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load questions",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/questions/${questionToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete question");
      }

      toast({
        title: "Question deleted!",
        description: "The question has been removed successfully.",
      });

      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (question: any) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Questions"
        description="Manage all questions in the question pool"
        action={
          <Link href="/admin/questions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Question
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select value={topicFilter || "all"} onValueChange={(val) => setTopicFilter(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {"  ".repeat(topic.level)}{topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficultyFilter || "all"} onValueChange={(val) => setDifficultyFilter(val === "all" ? "" : val)}>
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

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearch("");
                  setTopicFilter("");
                  setDifficultyFilter("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Question</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Used in Quizzes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-md truncate">{question.questionText}</div>
                      {question.hint && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Hint: {question.hint.substring(0, 50)}...
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{question.topic.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          question.difficulty === "EASY"
                            ? "default"
                            : question.difficulty === "HARD"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {question.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{question.type}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {question._count.quizPools}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/questions/${question.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(question)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {questions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No questions found. Create your first question to get started.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} questions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question?
              {questionToDelete && questionToDelete._count.quizPools > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This question is used in {questionToDelete._count.quizPools} quiz(es).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

