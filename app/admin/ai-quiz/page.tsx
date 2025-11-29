"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Wand2, Upload, CheckCircle, AlertCircle, Loader2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function AIQuizGeneratorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topics, setTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Form state
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTopicName, setSelectedTopicName] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sport, setSport] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [numQuestions, setNumQuestions] = useState("10");
  
  // Generated quiz state
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [generatedJSON, setGeneratedJSON] = useState("");
  const [metadata, setMetadata] = useState<any>(null);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);

  // Check if OpenAI is configured
  const [openAIConfigured, setOpenAIConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const response = await fetch("/api/admin/topics");
        const result = await response.json();

        if (response.ok) {
          setTopics(result.data.topics || []);
        }
      } catch {
        // Failed to load topics, continue with empty list
      } finally {
        setLoadingTopics(false);
      }
    }

    loadTopics();
  }, []);

  const handleGenerate = async () => {
    const trimmedTheme = customTheme.trim();
    const trimmedSourceUrl = sourceUrl.trim();
    const resolvedTopic = trimmedTheme || selectedTopicName.trim();
    const questionCount = parseInt(numQuestions, 10);

    if (!Number.isFinite(questionCount) || questionCount < 1) {
      toast({
        title: "Invalid number of questions",
        description: "Enter a valid number of questions (1-50).",
        variant: "destructive",
      });
      return;
    }

    if (!resolvedTopic && !trimmedSourceUrl) {
      toast({
        title: "Missing fields",
        description: "Provide a topic/theme or a source URL to generate a quiz.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGeneratedQuiz(null);
    setGeneratedJSON("");
    setMetadata(null);
    setOpenAIConfigured(null);
    setLastTaskId(null);

    try {
      const payload: Record<string, unknown> = {
        difficulty,
        numQuestions: questionCount,
      };

      if (resolvedTopic) {
        payload.topic = resolvedTopic;
      }

      if (sport.trim()) {
        payload.sport = sport.trim();
      }

      if (trimmedTheme) {
        payload.customTitle = trimmedTheme;
      }

      if (trimmedSourceUrl) {
        payload.sourceUrl = trimmedSourceUrl;
      }

      const responsePromise = fetch("/api/admin/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast({
        title: "AI generation started",
        description: "Saved to AI Background Tasks. You can keep working while we prepare the quiz.",
      });

      const response = await responsePromise;

      const result = await response.json();

      if (!response.ok) {
        // Check if it's an API key configuration error
        if (result.error?.includes("OpenAI API key")) {
          setOpenAIConfigured(false);
        }
        throw new Error(result.error || "Failed to generate quiz");
      }

      setOpenAIConfigured(true);

      const quiz = result.data?.quiz ?? null;
      const quizMetadata = result.data?.metadata ?? null;
      const taskId = result.data?.taskId ?? null;
      const statusMessage = result.data?.message ?? null;
      const status = result.data?.status ?? null;

      setGeneratedQuiz(quiz);
      setGeneratedJSON(quiz ? JSON.stringify(quiz, null, 2) : "");
      setMetadata(quizMetadata);
      setLastTaskId(taskId);

      const generatedQuestionCount = quiz?.questions?.length ?? 0;
      const toastDescription =
        quiz
          ? `Generated ${generatedQuestionCount} ${generatedQuestionCount === 1 ? "question" : "questions"} using AI. Saved to Background Tasks.`
          : statusMessage ||
            (status === "processing"
              ? "AI generation is running in the background. Track progress from AI Background Tasks."
              : "Quiz generation queued. Check AI Background Tasks for updates.");

      toast({
        title: quiz ? "Quiz generated!" : "Generation queued",
        description: toastDescription,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleImport = async () => {
    if (!generatedQuiz) return;

    setImporting(true);

    try {
      const response = await fetch("/api/admin/quizzes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedQuiz),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import quiz");
      }

      toast({
        title: "Import successful!",
        description: `Quiz "${generatedQuiz.title}" has been created.`,
      });

      router.push(`/admin/quizzes/${result.data.quiz.id}/edit`);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      setSelectedTopicName(topic.name);
    }
  };

  if (loadingTopics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="AI Quiz Generator"
        description="Generate quiz questions automatically using AI"
        icon={<Sparkles className="h-8 w-8" />}
        action={
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Edit AI Prompt
            </Button>
          </Link>
        }
      />

      {lastTaskId && (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-primary">Saved as background task</p>
            <p className="text-sm text-muted-foreground">
              Review and import this quiz later from the AI Background Tasks dashboard.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/ai-tasks/${lastTaskId}`}>Open task</Link>
          </Button>
        </div>
      )}

      {openAIConfigured === false && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  OpenAI API Key Not Configured
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  To use the AI Quiz Generator, add your OpenAI API key to the <code>.env</code> file:
                </p>
                <pre className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                  OPENAI_API_KEY=sk-...
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Configuration</CardTitle>
            <CardDescription>
              Select topic and parameters for AI generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Select value={selectedTopic} onValueChange={handleTopicChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {"  ".repeat(topic.level)}
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All questions will be about this topic. Leave blank if you provide a custom theme or URL.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customTheme">Custom Theme / Title</Label>
              <Input
                id="customTheme"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="e.g. Legends of the Premier League"
              />
              <p className="text-xs text-muted-foreground">
                Overrides the topic name above. Use this to set the quiz title or theme manually.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                type="url"
                inputMode="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/article"
              />
              <p className="text-xs text-muted-foreground">
                Provide a link and the AI will pull context from the page content.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport (Optional)</Label>
              <Input
                id="sport"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                placeholder="Auto-detected if left empty"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-detect from topic
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Overall Difficulty *</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Questions will have a mix of difficulties around this level
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions *</Label>
              <Input
                id="numQuestions"
                type="number"
                min={1}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum 50 questions per generation
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={
                generating ||
                !numQuestions ||
                (!customTheme.trim() && !selectedTopicName.trim() && !sourceUrl.trim())
              }
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Quiz with AI
                </>
              )}
            </Button>

            {metadata && (
              <div className="text-xs text-muted-foreground p-3 bg-muted rounded space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-muted-foreground mb-1">Topic / Theme:</span>
                    <span className="font-mono break-words">{metadata.topic}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground mb-1">Model:</span>
                    <span className="font-mono">{metadata.model}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground mb-1">Tokens used:</span>
                    <span className="font-mono">{metadata.tokensUsed}</span>
                  </div>
                  {metadata.customTitle && (
                    <div>
                      <span className="block text-muted-foreground mb-1">Custom title:</span>
                      <span className="font-mono break-words">{metadata.customTitle}</span>
                    </div>
                  )}
                  {metadata.sourceTitle && (
                    <div>
                      <span className="block text-muted-foreground mb-1">Source title:</span>
                      <span className="font-mono break-words">{metadata.sourceTitle}</span>
                    </div>
                  )}
                </div>
                {metadata.sourceUrl && (
                  <div className="pt-2 border-t">
                    <span className="block text-muted-foreground mb-1">Source URL:</span>
                    <a
                      href={metadata.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono break-all text-primary underline"
                    >
                      {metadata.sourceUrl}
                    </a>
                  </div>
                )}
                {metadata.promptPreview && (
                  <div className="pt-2 border-t">
                    <div className="font-semibold mb-1">Prompt Used (preview):</div>
                    <div className="font-mono text-xs bg-background p-2 rounded">
                      {metadata.promptPreview}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview & Generated Quiz */}
        <div className="space-y-6">
          {generatedQuiz && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Generated Quiz Preview
                  </CardTitle>
                  <CardDescription>Review and import the AI-generated quiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{generatedQuiz.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {generatedQuiz.description || "No description"}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sport:</span>{" "}
                      <span className="font-medium">{generatedQuiz.sport || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Difficulty:</span>{" "}
                      <Badge variant="outline">{generatedQuiz.difficulty || "MEDIUM"}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>{" "}
                      <span className="font-medium">{generatedQuiz.duration ? `${generatedQuiz.duration}s` : "Not set"}</span>
                    </div>
                  <div>
                    <span className="text-muted-foreground">Questions:</span>{" "}
                    <span className="font-medium">{generatedQuiz.questions?.length || 0}</span>
                  </div>
                  {metadata?.sourceUrl && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Source:</span>{" "}
                      <a
                        href={metadata.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary underline break-all"
                      >
                        {metadata.sourceTitle || metadata.sourceUrl}
                      </a>
                    </div>
                  )}
                </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Sample Questions</h4>
                    <div className="space-y-2">
                      {generatedQuiz.questions?.slice(0, 3).map((q: any, idx: number) => (
                        <div key={idx} className="text-sm border rounded p-2">
                          <div className="font-medium">
                            {idx + 1}. {q.text}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {q.answers?.length || 0} answers • {q.difficulty || "MEDIUM"} • Hint: {q.hint ? "✓" : "✗"}
                          </div>
                        </div>
                      ))}
                      {generatedQuiz.questions?.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          ... and {generatedQuiz.questions.length - 3} more questions
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full"
                    size="lg"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    {importing ? "Importing..." : "Import Generated Quiz"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Raw JSON</CardTitle>
                  <CardDescription>
                    You can copy and edit this JSON before importing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generatedJSON}
                    onChange={(e) => {
                      setGeneratedJSON(e.target.value);
                      try {
                        setGeneratedQuiz(JSON.parse(e.target.value));
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={15}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    You can edit the JSON above and the preview will update automatically
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {!generatedQuiz && (
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>AI-powered quiz generation process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      AI Generation
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Powered by OpenAI GPT-4</li>
                      <li>Generates accurate, engaging questions</li>
                      <li>Includes hints and explanations</li>
                      <li>Creates 4 plausible answers per question</li>
                      <li>Varies difficulty within the quiz</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">What Gets Generated</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Quiz title and description</li>
                      <li>SEO-optimized metadata</li>
                      <li>Multiple-choice questions</li>
                      <li>Helpful hints for each question</li>
                      <li>Educational explanations</li>
                      <li>Mixed difficulty levels</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">After Generation</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Preview the generated quiz</li>
                      <li>Edit the JSON if needed</li>
                      <li>Import directly to your quiz library</li>
                      <li>Further customize in the quiz editor</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 mt-4">
                    <h4 className="font-semibold mb-1 flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Tip
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Start with 5-10 questions to test quality. You can always generate more questions for the same topic later.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
