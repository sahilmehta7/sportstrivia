"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileJson, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { questionsImportSchema } from "@/lib/validations/quiz.schema";

interface QuizQuestionImportDialogProps {
    quizId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportSuccess: () => void;
}

export function QuizQuestionImportDialog({
    quizId,
    open,
    onOpenChange,
    onImportSuccess,
}: QuizQuestionImportDialogProps) {
    const { toast } = useToast();
    const [jsonInput, setJsonInput] = useState("");
    const [validating, setValidating] = useState(false);
    const [importing, setImporting] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        errors: string[];
    } | null>(null);

    const validateJSON = () => {
        setValidating(true);
        setValidationResult(null);

        try {
            const parsed = JSON.parse(jsonInput);
            const result = questionsImportSchema.safeParse(parsed);

            if (!result.success) {
                const errors = result.error.errors.map(
                    (err) => `${err.path.join(".")}: ${err.message}`
                );
                setValidationResult({ valid: false, errors });
            } else {
                setValidationResult({ valid: true, errors: [] });
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
        setImporting(true);

        try {
            const parsed = JSON.parse(jsonInput);
            const response = await fetch(`/api/admin/quizzes/${quizId}/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to import questions");
            }

            toast({
                title: "Import successful!",
                description: result.data.message,
            });

            onImportSuccess();
            onOpenChange(false);
            setJsonInput("");
            setValidationResult(null);
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

    const exampleJSON = {
        questions: [
            {
                text: "Which team won the 2023 NBA Championship?",
                difficulty: "EASY",
                topic: "NBA Finals",
                answers: [
                    { text: "Denver Nuggets", isCorrect: true },
                    { text: "Miami Heat", isCorrect: false },
                    { text: "Boston Celtics", isCorrect: false },
                    { text: "Los Angeles Lakers", isCorrect: false }
                ]
            }
        ]
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Questions from JSON</DialogTitle>
                    <DialogDescription>
                        Bulk add questions to this quiz by pasting a JSON object.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">JSON Input</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setJsonInput(JSON.stringify(exampleJSON, null, 2))}
                                className="text-xs h-7"
                            >
                                Load Example
                            </Button>
                        </div>
                        <Textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='{"questions": [...] }'
                            className="font-mono text-xs min-h-[300px]"
                        />
                    </div>

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
                                    <h4 className="font-semibold text-sm mb-1">
                                        {validationResult.valid ? "Validation Passed" : "Validation Failed"}
                                    </h4>
                                    {validationResult.errors.length > 0 && (
                                        <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                            {validationResult.errors.map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
                        Cancel
                    </Button>
                    {!validationResult?.valid ? (
                        <Button onClick={validateJSON} disabled={!jsonInput || validating}>
                            <FileJson className="mr-2 h-4 w-4" />
                            {validating ? "Validating..." : "Validate JSON"}
                        </Button>
                    ) : (
                        <Button onClick={handleImport} disabled={importing}>
                            <Upload className="mr-2 h-4 w-4" />
                            {importing ? "Importing..." : "Start Import"}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
