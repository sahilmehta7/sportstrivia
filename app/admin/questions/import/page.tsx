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

export default function QuestionsImportPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [jsonInput, setJsonInput] = useState("");
    const [validating, setValidating] = useState(false);
    const [importing, setImporting] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [preview, setPreview] = useState<any[] | null>(null);

    const validateJSON = () => {
        setValidating(true);
        setValidationResult(null);
        setPreview(null);

        try {
            const parsed = JSON.parse(jsonInput);

            if (!Array.isArray(parsed)) {
                throw new Error("Input must be a JSON array of questions");
            }

            const errors: string[] = [];

            if (parsed.length === 0) {
                errors.push("At least one question is required");
            }

            parsed.forEach((q: any, idx: number) => {
                if (!q.text) errors.push(`Question ${idx + 1}: text is required`);
                if (!q.answers || !Array.isArray(q.answers) || q.answers.length < 2) {
                    errors.push(`Question ${idx + 1}: at least 2 answers required`);
                }

                const correctAnswers = q.answers?.filter((a: any) => a.isCorrect);
                if (correctAnswers?.length !== 1) {
                    errors.push(`Question ${idx + 1}: exactly one correct answer required`);
                }
            });

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
            const response = await fetch("/api/admin/questions/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preview),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to import questions");
            }

            toast({
                title: "Import successful!",
                description: result.message || `Successfully imported ${result.count} questions.`,
            });

            router.push("/admin/questions");
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

    const exampleJSON = [
        {
            text: "Which tennis player has won the most Men's Grand Slam titles as of 2023?",
            difficulty: "medium",
            topic: "Tennis",
            hint: "He is from Serbia",
            explanation: "Novak Djokovic won his 24th Grand Slam title at the 2023 US Open.",
            answers: [
                { text: "Novak Djokovic", isCorrect: true },
                { text: "Rafael Nadal", isCorrect: false },
                { text: "Roger Federer", isCorrect: false },
                { text: "Pete Sampras", isCorrect: false }
            ]
        },
        {
            text: "In which city were the first modern Olympic Games held in 1896?",
            difficulty: "easy",
            topic: "Olympics",
            explanation: "The 1896 Summer Olympics were the first international Olympic Games held in modern history.",
            answers: [
                { text: "Athens", isCorrect: true },
                { text: "Paris", isCorrect: false },
                { text: "London", isCorrect: false },
                { text: "Rome", isCorrect: false }
            ]
        }
    ];

    return (
        <div>
            <PageHeader
                title="Import Questions"
                description="Bulk import questions into the global pool from a JSON array"
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Import Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>JSON Input</CardTitle>
                        <CardDescription>
                            Paste your JSON array of questions below
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder="Paste JSON array here..."
                            rows={20}
                            className="font-mono text-sm"
                        />

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={validateJSON}
                                disabled={!jsonInput || validating}
                                className="flex-1"
                            >
                                <FileJson className="mr-2 h-4 w-4" />
                                {validating ? "Validating..." : "Validate JSON"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setJsonInput(JSON.stringify(exampleJSON, null, 2))}
                            >
                                Load Example
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
                                            <p className="text-sm">Ready to import {preview?.length} questions!</p>
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
                                {importing ? "Importing..." : `Import ${preview?.length} Questions`}
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
                                <CardTitle>Preview ({preview.length})</CardTitle>
                                <CardDescription>Review questions before importing</CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-[600px] overflow-y-auto space-y-4">
                                {preview.map((q, idx) => (
                                    <div key={idx} className="border rounded p-3 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm">#{idx + 1}</span>
                                            <div className="flex gap-2">
                                                {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                                                <Badge variant="secondary">{q.difficulty || "MEDIUM"}</Badge>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium">{q.text}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {q.answers.map((a: any, aIdx: number) => (
                                                <div key={aIdx} className={`text-xs p-1 rounded ${a.isCorrect ? "bg-green-100 dark:bg-green-900 border-green-200" : "bg-muted"}`}>
                                                    {a.text} {a.isCorrect && "✓"}
                                                </div>
                                            ))}
                                        </div>
                                        {q.explanation && (
                                            <p className="text-xs text-muted-foreground italic mt-1">
                                                Exp: {q.explanation}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>JSON Format</CardTitle>
                            <CardDescription>Required structure for questions array</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-semibold mb-2">Required Fields</h4>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li><code className="text-xs">text</code> - Question text</li>
                                        <li><code className="text-xs">answers[]</code> - Array of answers</li>
                                        <li><code className="text-xs">answers[].text</code> - Answer text</li>
                                        <li><code className="text-xs">answers[].isCorrect</code> - Boolean</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Optional Fields</h4>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li><code className="text-xs">topic</code> - Topic name (will create if doesn't exist)</li>
                                        <li><code className="text-xs">difficulty</code> - easy, medium, hard</li>
                                        <li><code className="text-xs">hint</code> - Optional hint text</li>
                                        <li><code className="text-xs">explanation</code> - Explanation shown after answering</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Example Structure</h4>
                                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                        {`[
  {
    "text": "Your question here?",
    "topic": "Sports",
    "difficulty": "medium",
    "answers": [
      { "text": "Correct Answer", "isCorrect": true },
      { "text": "Wrong Answer", "isCorrect": false }
    ]
  }
]`}
                                    </pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
