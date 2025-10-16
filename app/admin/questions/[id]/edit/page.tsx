"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditQuestionPage({ params }: EditQuestionPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [questionId, setQuestionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      setQuestionId(resolvedParams.id);

      try {
        // Load topics and question in parallel
        const [topicsResponse, questionResponse] = await Promise.all([
          fetch("/api/topics"),
          fetch(`/api/admin/questions/${resolvedParams.id}`),
        ]);

        const [topicsResult, questionResult] = await Promise.all([
          topicsResponse.json(),
          questionResponse.json(),
        ]);

        if (!topicsResponse.ok || !questionResponse.ok) {
          throw new Error("Failed to load data");
        }

        setTopics(topicsResult.data.topics);
        setQuestion(questionResult.data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        router.push("/admin/questions");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, router, toast]);

  const handleSave = async (data: any) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update question");
      }

      toast({
        title: "Question updated!",
        description: "The question has been updated successfully.",
      });

      router.push("/admin/questions");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete question");
      }

      toast({
        title: "Question deleted!",
        description: result.data.message || "The question has been deleted.",
      });

      router.push("/admin/questions");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
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
        title="Edit Question"
        description="Update question details and answers"
        action={
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Link href="/admin/questions">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <QuestionEditor
        initialData={question}
        topics={topics}
        onSave={handleSave}
        onCancel={() => router.push("/admin/questions")}
        saving={saving}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question?
              {question?._count?.quizPools > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This question is used in {question._count.quizPools} quiz(es) and cannot be deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || question?._count?.quizPools > 0}
            >
              {deleting ? "Deleting..." : "Delete Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

