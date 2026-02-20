"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileJson, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);

  const validateJSON = () => {
    setValidating(true);
    setValidationResult(null);
    setPreview(null);

    try {
      const parsed = JSON.parse(jsonInput);

      // Basic validation
      const errors: string[] = [];

      if (!parsed.title) errors.push("Title is required");

      if (parsed.playMode === "GRID_3X3") {
        errors.push("Grid import is no longer supported here. Use the dedicated Import Grid page at /admin/grids/import");
      } else {
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
          errors.push("Questions array is required");
        }
        if (parsed.questions && parsed.questions.length === 0) {
          errors.push("At least one question is required");
        }

        // Validate each question
        parsed.questions?.forEach((q: any, idx: number) => {
          if (!q.text) errors.push(`Question ${idx + 1}: text is required`);
          if (!q.answers || q.answers.length < 2) {
            errors.push(`Question ${idx + 1}: at least 2 answers required`);
          }

          const correctAnswers = q.answers?.filter((a: any) => a.isCorrect);
          if (correctAnswers?.length !== 1) {
            errors.push(`Question ${idx + 1}: exactly one correct answer required`);
          }
        });
      }

      if (errors.length > 0) {
        setValidationResult({ valid: false, errors });
      } else {
        setValidationResult({ valid: true, errors: [] });
        setPreview(parsed);
      }
    } catch (error: any) {
      setValidationResult({
        valid: false,
        errors: ["Invalid JSON format: " + error.message],
      });
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setImporting(true);

    try {
      const response = await fetch("/api/admin/quizzes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import quiz");
      }

      toast({
        title: "Import successful!",
        description: `Quiz "${preview.title}" with ${preview.questions.length} questions has been created.`,
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

  const exampleGridJSON = {
    title: "NBA Grid: MVP x Team",
    playMode: "GRID_3X3",
    description: "Fill in the grid with players who match the row and column criteria",
    sport: "Basketball",
    difficulty: "HARD",
    playConfig: {
      rows: ["Lakers", "Celtics", "Bulls"],
      cols: ["MVP Winner", ">30 PPG Season", "Hall of Fame"],
      cells: [
        ["Kobe Bryant\nMagic Johnson\nShaquille O'Neal", "Kobe Bryant\nJerry West\nElgin Baylor", "Kobe Bryant\nMagic Johnson\nKareem Abdul-Jabbar"],
        ["Larry Bird\nBill Russell\nBob Cousy", "Larry Bird\nJohn Havlicek", "Larry Bird\nBill Russell\nKevin McHale"],
        ["Michael Jordan\nDerrick Rose", "Michael Jordan", "Michael Jordan\nScottie Pippen\nDennis Rodman"]
      ]
    },
    seo: {
      title: "NBA All-Time Greats Grid",
      keywords: ["nba", "basketball", "immaculate grid", "trivia"]
    }
  };

  const exampleJSON = {
    title: "NBA Champions Quiz",
    slug: "nba-champions-quiz",
    description: "Challenge yourself with questions about NBA championship history and legendary teams",
    sport: "Basketball",
    difficulty: "medium",
    duration: 600,
    passingScore: 70,
    seo: {
      title: "NBA Champions Quiz - Test Your Basketball Knowledge",
      description: "Challenge yourself with questions about NBA championship history and legendary teams. Test your knowledge of NBA Finals history, championship winners, and basketball legends.",
      keywords: ["nba", "basketball", "champions", "quiz", "nba finals", "nba championship"]
    },
    questions: [
      {
        text: "Which team won the 2023 NBA Championship?",
        difficulty: "easy",
        topic: "NBA Finals",
        hint: "This team is from Denver",
        explanation: "The Denver Nuggets won their first NBA championship in 2023",
        answers: [
          { text: "Denver Nuggets", isCorrect: true },
          { text: "Miami Heat", isCorrect: false },
          { text: "Boston Celtics", isCorrect: false },
          { text: "Los Angeles Lakers", isCorrect: false }
        ]
      },
      {
        text: "How many championships did Michael Jordan win with the Bulls?",
        difficulty: "medium",
        topic: "Chicago Bulls",
        hint: "Think of his two three-peats",
        explanation: "Michael Jordan won 6 NBA championships with the Chicago Bulls (1991-1993, 1996-1998)",
        answers: [
          { text: "6", isCorrect: true },
          { text: "5", isCorrect: false },
          { text: "7", isCorrect: false },
          { text: "4", isCorrect: false }
        ]
      }
    ]
  };

  return (
    <div>
      <PageHeader
        title="Import Quiz from JSON"
        description="Bulk create quiz with questions and answers from JSON file"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>JSON Input</CardTitle>
            <CardDescription>
              Paste your JSON data below and click validate to preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON here..."
              rows={20}
              className="font-mono text-sm"
            />

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                onClick={validateJSON}
                disabled={!jsonInput || validating}
                className="flex-1 min-w-[120px]"
              >
                <FileJson className="mr-2 h-4 w-4" />
                {validating ? "Validating..." : "Validate JSON"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setJsonInput(JSON.stringify(exampleJSON, null, 2))}
              >
                Standard Example
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setJsonInput(JSON.stringify(exampleGridJSON, null, 2))}
              >
                Grid Example
              </Button>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className={`rounded-lg border p-4 ${validationResult.valid
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-red-500 bg-red-50 dark:bg-red-950"
                }`}>
                <div className="flex items-start gap-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">
                      {validationResult.valid ? "Validation Passed" : "Validation Failed"}
                    </h4>
                    {validationResult.errors.length > 0 && (
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {validationResult.errors.map((error: string, idx: number) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    )}
                    {validationResult.valid && (
                      <p className="text-sm">Ready to import!</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Import Button */}
            {validationResult?.valid && (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
                size="lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                {importing ? "Importing..." : "Import Quiz"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Preview & Instructions */}
        <div className="space-y-6">
          {/* Preview */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Review before importing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{preview.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {preview.description || "No description"}
                  </p>
                  {preview.playMode === "GRID_3X3" && (
                    <Badge variant="secondary" className="mt-2">Immaculate Grid Mode</Badge>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sport:</span>{" "}
                    <span className="font-medium">{preview.sport || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Difficulty:</span>{" "}
                    <Badge variant="outline">{preview.difficulty || "MEDIUM"}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    <span className="font-medium">{preview.duration ? `${preview.duration}s` : "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passing Score:</span>{" "}
                    <span className="font-medium">{preview.passingScore || 70}%</span>
                  </div>
                </div>

                <Separator />

                {preview.playMode === "GRID_3X3" && preview.playConfig ? (
                  <div>
                    <h4 className="font-semibold mb-2">
                      Grid Configuration
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      <p>Rows: {preview.playConfig.rows.join(", ")}</p>
                      <p>Cols: {preview.playConfig.cols.join(", ")}</p>
                      <p className="mt-1">{preview.playConfig.cells?.flat().filter((c: any) => c && c.length > 0).length || 9} cells configured</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold mb-2">
                      Questions ({preview.questions?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {preview.questions?.map((q: any, idx: number) => (
                        <div key={idx} className="text-sm border rounded p-2">
                          <div className="font-medium">
                            {idx + 1}. {q.text}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {q.answers?.length} answers • Difficulty: {q.difficulty || "MEDIUM"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {preview.seo && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">SEO Settings</h4>
                      <div className="text-sm space-y-1">
                        {preview.seo.title && (
                          <div>
                            <span className="text-muted-foreground">Title:</span> {preview.seo.title}
                          </div>
                        )}
                        {preview.seo.keywords && (
                          <div>
                            <span className="text-muted-foreground">Keywords:</span>{" "}
                            {preview.seo.keywords.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>JSON Format</CardTitle>
              <CardDescription>Required structure for quiz import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Required Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="text-xs">title</code> - Quiz title</li>
                    <li><code className="text-xs">playMode</code> - &quot;STANDARD&quot; or &quot;GRID_3X3&quot;</li>
                  </ul>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-medium">For STANDARD mode:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li><code className="text-xs">questions[]</code> - Array of questions</li>
                    </ul>
                    <p className="font-medium mt-1">For GRID_3X3 mode:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li><code className="text-xs">playConfig</code> - {`{ rows: [], cols: [], cells: [][] }`}</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Optional Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="text-xs">slug</code> - URL slug (auto-generated if not provided)</li>
                    <li><code className="text-xs">description</code> - Brief description of the quiz</li>
                    <li><code className="text-xs">sport</code> - Sport category</li>
                    <li><code className="text-xs">difficulty</code> - easy, medium, or hard (case-insensitive)</li>
                    <li><code className="text-xs">duration</code> - Quiz duration in seconds</li>
                    <li><code className="text-xs">passingScore</code> - Percentage (default: 70)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
}
