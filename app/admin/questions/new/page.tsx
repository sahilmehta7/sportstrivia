"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function NewQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      const result = await response.json();
      if (response.ok) {
        setTopics(result.data.topics);
      }
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleSave = async (data: any) => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create question");
      }

      toast({
        title: "Question created!",
        description: "The question has been added to the question pool.",
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

  if (loadingTopics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create New Question"
        description="Add a new question to the question pool"
        action={
          <Link href="/admin/questions">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Questions
            </Button>
          </Link>
        }
      />

      <QuestionEditor
        topics={topics}
        onSave={handleSave}
        onCancel={() => router.push("/admin/questions")}
        saving={saving}
      />
    </div>
  );
}

