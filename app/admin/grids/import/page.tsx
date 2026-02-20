"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileJson, CheckCircle, AlertCircle, Copy, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ImportGridPage() {
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
            const errors: string[] = [];

            if (!parsed.title) errors.push("title is required");
            if (!parsed.rows || !Array.isArray(parsed.rows) || parsed.rows.length !== 3) {
                errors.push("rows must be an array of exactly 3 strings");
            }
            if (!parsed.cols || !Array.isArray(parsed.cols) || parsed.cols.length !== 3) {
                errors.push("cols must be an array of exactly 3 strings");
            }
            if (!parsed.cellAnswers || !Array.isArray(parsed.cellAnswers) || parsed.cellAnswers.length !== 3) {
                errors.push("cellAnswers must be a 3×3 array");
            } else {
                for (let r = 0; r < 3; r++) {
                    if (!Array.isArray(parsed.cellAnswers[r]) || parsed.cellAnswers[r].length !== 3) {
                        errors.push(`cellAnswers[${r}] must have exactly 3 entries`);
                    } else {
                        for (let c = 0; c < 3; c++) {
                            const cell = parsed.cellAnswers[r][c];
                            if (typeof cell !== "string" || cell.trim().length === 0) {
                                errors.push(`cellAnswers[${r}][${c}] must be a non-empty string (newline-separated answers)`);
                            }
                        }
                    }
                }
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
                errors: ["Invalid JSON: " + error.message],
            });
        } finally {
            setValidating(false);
        }
    };

    const handleImport = async () => {
        if (!preview) return;
        setImporting(true);

        try {
            const response = await fetch("/api/admin/grids/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preview),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to import grid");
            }

            toast({
                title: "Grid imported!",
                description: `"${preview.title}" has been created successfully.`,
            });

            router.push("/admin/grids");
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
        title: "NBA Grid: MVP x Team",
        description: "Fill in the grid with NBA players matching the row and column criteria",
        sport: "Basketball",
        status: "PUBLISHED",
        timeLimit: 300,
        rows: ["Lakers", "Celtics", "Bulls"],
        cols: ["MVP Winner", ">30 PPG Season", "Hall of Fame"],
        cellAnswers: [
            [
                "Kobe Bryant\nMagic Johnson\nShaquille O'Neal",
                "Kobe Bryant\nJerry West\nElgin Baylor",
                "Kobe Bryant\nMagic Johnson\nKareem Abdul-Jabbar",
            ],
            [
                "Larry Bird\nBill Russell\nBob Cousy",
                "Larry Bird\nJohn Havlicek",
                "Larry Bird\nBill Russell\nKevin McHale",
            ],
            [
                "Michael Jordan\nDerrick Rose",
                "Michael Jordan",
                "Michael Jordan\nScottie Pippen\nDennis Rodman",
            ],
        ],
    };

    const copyExample = () => {
        setJsonInput(JSON.stringify(exampleJSON, null, 2));
        toast({ title: "Example loaded", description: "You can now validate and import." });
    };

    // Count total answers in preview
    const totalAnswers = preview?.cellAnswers
        ?.flat()
        .reduce((sum: number, cell: string) => sum + cell.split("\n").filter(Boolean).length, 0) ?? 0;

    return (
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/grids">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Import Grid</h1>
                    <p className="text-muted-foreground">
                        Create an Immaculate Grid from JSON data
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileJson className="h-5 w-5" />
                            JSON Input
                        </CardTitle>
                        <CardDescription>
                            Paste your grid JSON below, then validate before importing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder={`Paste your grid JSON here...\n\n${JSON.stringify(exampleJSON, null, 2).slice(0, 200)}...`}
                            value={jsonInput}
                            onChange={(e) => {
                                setJsonInput(e.target.value);
                                setValidationResult(null);
                                setPreview(null);
                            }}
                            className="min-h-[300px] font-mono text-xs"
                        />

                        <div className="flex gap-2">
                            <Button onClick={validateJSON} disabled={!jsonInput.trim() || validating} className="flex-1">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {validating ? "Validating..." : "Validate"}
                            </Button>
                            <Button variant="outline" onClick={copyExample}>
                                <Copy className="mr-2 h-4 w-4" />
                                Load Example
                            </Button>
                        </div>

                        {/* Validation Result */}
                        {validationResult && (
                            <div className={`rounded-lg border p-3 ${validationResult.valid ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {validationResult.valid ? (
                                        <><CheckCircle className="h-4 w-4 text-emerald-600" /><span className="font-medium text-emerald-800 dark:text-emerald-300">Valid</span></>
                                    ) : (
                                        <><AlertCircle className="h-4 w-4 text-red-600" /><span className="font-medium text-red-800 dark:text-red-300">Invalid</span></>
                                    )}
                                </div>
                                {validationResult.errors.length > 0 && (
                                    <ul className="list-disc list-inside space-y-1 text-xs text-red-700 dark:text-red-400">
                                        {validationResult.errors.map((e: string, i: number) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview + Schema */}
                <div className="space-y-6">
                    {/* Preview */}
                    {preview && (
                        <Card className="border-emerald-200 dark:border-emerald-900">
                            <CardHeader>
                                <CardTitle className="text-lg">Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Title</span>
                                    <p className="font-semibold">{preview.title}</p>
                                </div>
                                {preview.description && (
                                    <div>
                                        <span className="text-xs font-bold uppercase text-muted-foreground">Description</span>
                                        <p className="text-sm text-muted-foreground">{preview.description}</p>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    {preview.sport && <Badge variant="secondary">{preview.sport}</Badge>}
                                    <Badge variant="outline">{preview.status || "DRAFT"}</Badge>
                                    {preview.timeLimit && <Badge variant="outline">{preview.timeLimit}s</Badge>}
                                </div>

                                {/* Grid Preview */}
                                <div className="grid grid-cols-4 gap-1 text-[10px]">
                                    <div className="p-1" />
                                    {preview.cols.map((col: string, i: number) => (
                                        <div key={i} className="p-1 text-center font-bold text-primary bg-primary/5 rounded">
                                            {col}
                                        </div>
                                    ))}
                                    {preview.rows.map((row: string, r: number) => (
                                        <div key={r} className="contents">
                                            <div className="p-1 text-right font-bold text-primary bg-primary/5 rounded flex items-center justify-end">
                                                {row}
                                            </div>
                                            {preview.cellAnswers[r].map((cell: string, c: number) => {
                                                const answers = cell.split("\n").filter(Boolean);
                                                return (
                                                    <div key={c} className="p-1 border rounded bg-muted/30 text-center">
                                                        <span className="font-medium">{answers.length}</span>
                                                        <span className="text-muted-foreground"> answers</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Total: <strong>{totalAnswers}</strong> accepted answers across 9 cells
                                </p>

                                <Button onClick={handleImport} disabled={importing} className="w-full" size="lg">
                                    <Upload className="mr-2 h-4 w-4" />
                                    {importing ? "Importing..." : "Import Grid"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Schema Reference */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">JSON Schema</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs space-y-2 text-muted-foreground">
                                <p><code className="text-foreground">title</code> — Grid title <span className="text-red-500">*</span></p>
                                <p><code className="text-foreground">description</code> — Optional description</p>
                                <p><code className="text-foreground">sport</code> — Sport category (e.g. &quot;Football&quot;)</p>
                                <p><code className="text-foreground">status</code> — &quot;DRAFT&quot; or &quot;PUBLISHED&quot;</p>
                                <p><code className="text-foreground">timeLimit</code> — Seconds (optional)</p>
                                <p><code className="text-foreground">rows</code> — Array of 3 row labels <span className="text-red-500">*</span></p>
                                <p><code className="text-foreground">cols</code> — Array of 3 column labels <span className="text-red-500">*</span></p>
                                <p><code className="text-foreground">cellAnswers</code> — 3×3 array of newline-separated accepted answers <span className="text-red-500">*</span></p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
