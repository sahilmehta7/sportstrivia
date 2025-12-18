"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Difficulty } from "@prisma/client";
import { trackEvent } from "@/lib/analytics";

interface AISuggestionModalProps {
  topicName: string;
  trigger?: React.ReactNode;
}

export function AISuggestionModal({ topicName, trigger }: AISuggestionModalProps) {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const onGenerate = async () => {
    try {
      setLoading(true);
      trackEvent("ai_generation", { topic: topicName, difficulty, numQuestions });
      setResult(null);
      const res = await fetch("/api/ai/suggest-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicName, difficulty, numQuestions }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || "Failed to generate");
      }
      setResult(data.data);
      toast({ title: "AI Suggestion Ready", description: "Preview a generated quiz" });
    } catch (err: any) {
      toast({ title: "Could not generate", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Suggested Quiz</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Difficulty</label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Difficulty.EASY}>Easy</SelectItem>
                  <SelectItem value={Difficulty.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={Difficulty.HARD}>Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Questions</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, parseInt(e.target.value || "10", 10))))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Close
            </Button>
            <Button onClick={onGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>

          {result?.quiz && (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <div className="mb-2 font-semibold">Preview</div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(result.quiz, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

