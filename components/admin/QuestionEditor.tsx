"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Answer {
  id?: string;
  answerText: string;
  answerImageUrl?: string;
  answerVideoUrl?: string;
  answerAudioUrl?: string;
  isCorrect: boolean;
  displayOrder: number;
}

interface QuestionEditorProps {
  initialData?: any;
  topics: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function QuestionEditor({ 
  initialData, 
  topics, 
  onSave, 
  onCancel, 
  saving = false 
}: QuestionEditorProps) {
  const [formData, setFormData] = useState({
    type: initialData?.type || "MULTIPLE_CHOICE",
    topicId: initialData?.topicId || "",
    difficulty: initialData?.difficulty || "MEDIUM",
    questionText: initialData?.questionText || "",
    questionImageUrl: initialData?.questionImageUrl || "",
    questionVideoUrl: initialData?.questionVideoUrl || "",
    questionAudioUrl: initialData?.questionAudioUrl || "",
    hint: initialData?.hint || "",
    explanation: initialData?.explanation || "",
    explanationImageUrl: initialData?.explanationImageUrl || "",
    explanationVideoUrl: initialData?.explanationVideoUrl || "",
    randomizeAnswerOrder: initialData?.randomizeAnswerOrder || false,
    timeLimit: initialData?.timeLimit?.toString() || "",
  });

  const [answers, setAnswers] = useState<Answer[]>(
    initialData?.answers?.map((a: any, idx: number) => ({
      id: a.id,
      answerText: a.answerText || "",
      answerImageUrl: a.answerImageUrl || "",
      answerVideoUrl: a.answerVideoUrl || "",
      answerAudioUrl: a.answerAudioUrl || "",
      isCorrect: a.isCorrect || false,
      displayOrder: a.displayOrder ?? idx,
    })) || [
      { answerText: "", isCorrect: true, displayOrder: 0 },
      { answerText: "", isCorrect: false, displayOrder: 1 },
      { answerText: "", isCorrect: false, displayOrder: 2 },
      { answerText: "", isCorrect: false, displayOrder: 3 },
    ]
  );

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAnswer = (index: number, field: string, value: any) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = { ...newAnswers[index], [field]: value };
      
      // If marking as correct, unmark others
      if (field === "isCorrect" && value === true) {
        newAnswers.forEach((a, i) => {
          if (i !== index) a.isCorrect = false;
        });
      }
      
      return newAnswers;
    });
  };

  const addAnswer = () => {
    setAnswers(prev => [
      ...prev,
      {
        answerText: "",
        isCorrect: false,
        displayOrder: prev.length,
      },
    ]);
  };

  const removeAnswer = (index: number) => {
    if (answers.length <= 2) return; // Keep at least 2 answers
    setAnswers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const correctAnswers = answers.filter(a => a.isCorrect);
    if (correctAnswers.length !== 1) {
      alert("Exactly one answer must be marked as correct");
      return;
    }

    if (answers.some(a => !a.answerText.trim())) {
      alert("All answers must have text");
      return;
    }

    const data = {
      type: formData.type,
      topicId: formData.topicId,
      difficulty: formData.difficulty,
      questionText: formData.questionText,
      questionImageUrl: formData.questionImageUrl || undefined,
      questionVideoUrl: formData.questionVideoUrl || undefined,
      questionAudioUrl: formData.questionAudioUrl || undefined,
      hint: formData.hint || undefined,
      explanation: formData.explanation || undefined,
      explanationImageUrl: formData.explanationImageUrl || undefined,
      explanationVideoUrl: formData.explanationVideoUrl || undefined,
      randomizeAnswerOrder: formData.randomizeAnswerOrder,
      timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
      answers: answers.map((a, idx) => ({
        ...(a.id && { id: a.id }),
        answerText: a.answerText,
        answerImageUrl: a.answerImageUrl || undefined,
        answerVideoUrl: a.answerVideoUrl || undefined,
        answerAudioUrl: a.answerAudioUrl || undefined,
        isCorrect: a.isCorrect,
        displayOrder: idx,
      })),
    };

    await onSave(data);
  };

  const correctAnswerIndex = answers.findIndex(a => a.isCorrect);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Details */}
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Basic question information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Question Type *</Label>
              <Select value={formData.type} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                  <SelectItem value="FILL_BLANK">Fill in the Blank</SelectItem>
                  <SelectItem value="FLASHCARD">Flashcard</SelectItem>
                  <SelectItem value="IMAGE_BASED">Image Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topicId">Topic *</Label>
              <Select value={formData.topicId} onValueChange={(value) => updateField("topicId", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {"  ".repeat(topic.level)}{topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => updateField("difficulty", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionText">Question Text *</Label>
            <Textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) => updateField("questionText", e.target.value)}
              placeholder="Enter your question here..."
              rows={3}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="questionImageUrl">Image URL</Label>
              <Input
                id="questionImageUrl"
                type="url"
                value={formData.questionImageUrl}
                onChange={(e) => updateField("questionImageUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionVideoUrl">Video URL</Label>
              <Input
                id="questionVideoUrl"
                type="url"
                value={formData.questionVideoUrl}
                onChange={(e) => updateField("questionVideoUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionAudioUrl">Audio URL</Label>
              <Input
                id="questionAudioUrl"
                type="url"
                value={formData.questionAudioUrl}
                onChange={(e) => updateField("questionAudioUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Options</CardTitle>
          <CardDescription>
            At least 2 answers required. Mark exactly one as correct.
            {correctAnswerIndex >= 0 && (
              <Badge variant="default" className="ml-2">
                Answer {String.fromCharCode(65 + correctAnswerIndex)} is correct
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {answers.map((answer, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Answer {String.fromCharCode(65 + index)}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={answer.isCorrect}
                      onCheckedChange={(checked) => updateAnswer(index, "isCorrect", checked)}
                    />
                    <Label className="text-sm">
                      {answer.isCorrect ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Correct
                        </span>
                      ) : (
                        "Mark as correct"
                      )}
                    </Label>
                  </div>
                  {answers.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnswer(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  value={answer.answerText}
                  onChange={(e) => updateAnswer(index, "answerText", e.target.value)}
                  placeholder="Answer text..."
                  required
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  type="url"
                  value={answer.answerImageUrl || ""}
                  onChange={(e) => updateAnswer(index, "answerImageUrl", e.target.value)}
                  placeholder="Image URL (optional)"
                />
                <Input
                  type="url"
                  value={answer.answerVideoUrl || ""}
                  onChange={(e) => updateAnswer(index, "answerVideoUrl", e.target.value)}
                  placeholder="Video URL (optional)"
                />
                <Input
                  type="url"
                  value={answer.answerAudioUrl || ""}
                  onChange={(e) => updateAnswer(index, "answerAudioUrl", e.target.value)}
                  placeholder="Audio URL (optional)"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addAnswer}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Answer Option
          </Button>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Randomize Answer Order</Label>
              <p className="text-sm text-muted-foreground">
                Shuffle answer options for each quiz attempt
              </p>
            </div>
            <Switch
              checked={formData.randomizeAnswerOrder}
              onCheckedChange={(checked) => updateField("randomizeAnswerOrder", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Help & Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Hints & Explanation</CardTitle>
          <CardDescription>Help users learn from the question</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hint">Hint (Optional)</Label>
            <Textarea
              id="hint"
              value={formData.hint}
              onChange={(e) => updateField("hint", e.target.value)}
              placeholder="A helpful hint for users..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => updateField("explanation", e.target.value)}
              placeholder="Explain the correct answer..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="explanationImageUrl">Explanation Image URL</Label>
              <Input
                id="explanationImageUrl"
                type="url"
                value={formData.explanationImageUrl}
                onChange={(e) => updateField("explanationImageUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanationVideoUrl">Explanation Video URL</Label>
              <Input
                id="explanationVideoUrl"
                type="url"
                value={formData.explanationVideoUrl}
                onChange={(e) => updateField("explanationVideoUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>Optional question-specific configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
            <Input
              id="timeLimit"
              type="number"
              min="1"
              value={formData.timeLimit}
              onChange={(e) => updateField("timeLimit", e.target.value)}
              placeholder="Optional - overrides quiz-level timing"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use quiz-level timing
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : initialData ? "Update Question" : "Create Question"}
        </Button>
      </div>
    </form>
  );
}

