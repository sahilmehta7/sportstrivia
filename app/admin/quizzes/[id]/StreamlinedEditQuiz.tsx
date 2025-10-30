"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Trash2, CheckCircle, Archive, EyeOff } from "lucide-react";
import Link from "next/link";

interface StreamlinedEditQuizProps {
  quizId: string;
  initialData: any;
  onSave: (data: any) => Promise<void>;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  loading: boolean;
  saving: boolean;
}

export function StreamlinedEditQuiz({
  quizId: _quizId,
  initialData,
  onSave: _onSave,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
  loading,
  saving,
}: StreamlinedEditQuizProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading quiz data...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/quizzes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Edit: {initialData.title || "Quiz"}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {initialData.status !== "PUBLISHED" && (
              <Button type="button" variant="default" size="sm" onClick={onPublish} disabled={saving}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Publish
              </Button>
            )}

            {initialData.status === "PUBLISHED" && (
              <>
                <Button type="button" variant="secondary" size="sm" onClick={onUnpublish} disabled={saving}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onArchive} disabled={saving}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </>
            )}

            <Button type="submit" size="default" disabled={saving} form="quiz-edit-form">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content will go here - placeholder for now */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-muted-foreground">Form content will go here...</p>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{initialData.title}&quot;? This will archive the quiz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
