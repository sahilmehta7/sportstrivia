"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, CheckCircle, FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PreviewRow = { date: string; word: string; length: number };

function addDaysToDateString(dateString: string, daysToAdd: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function normalizeWordsFromTextarea(input: string): string[] {
  return input
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => value.toUpperCase());
}

function validateWords(words: string[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  words.forEach((word, idx) => {
    if (!/^[A-Z]+$/.test(word)) {
      errors.push(`Line ${idx + 1}: "${word}" must contain only letters A-Z (no spaces or punctuation)`);
      return;
    }
    if (word.length < 3 || word.length > 12) {
      errors.push(`Line ${idx + 1}: "${word}" must be 3-12 letters`);
    }
    if (seen.has(word)) {
      errors.push(`Line ${idx + 1}: duplicate word "${word}"`);
    }
    seen.add(word);
  });

  return errors;
}

export default function DailyWordleImportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [startDate, setStartDate] = useState("");
  const [wordsInput, setWordsInput] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [allowOverwriteWithAttempts, setAllowOverwriteWithAttempts] = useState(false);

  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const words = useMemo(() => normalizeWordsFromTextarea(wordsInput), [wordsInput]);
  const preview: PreviewRow[] = useMemo(() => {
    if (!startDate) return [];
    return words.map((word, idx) => ({
      date: addDaysToDateString(startDate, idx),
      word,
      length: word.length,
    }));
  }, [startDate, words]);

  const validate = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      const errors: string[] = [];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        errors.push("Start date is required (YYYY-MM-DD)");
      }

      if (words.length === 0) {
        errors.push("At least one word is required");
      } else {
        errors.push(...validateWords(words));
      }

      setValidationResult({ valid: errors.length === 0, errors });
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult?.valid) return;
    setImporting(true);

    try {
      const response = await fetch("/api/admin/daily/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          words,
          overwriteExisting,
          allowOverwriteWithAttempts,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to import daily word puzzles");
      }

      toast({
        title: "Import complete",
        description: `Created ${result.data.createdCount}, updated ${result.data.updatedCount}, skipped ${result.data.skippedCount}, conflicts ${result.data.conflictCount}.`,
      });

      router.push("/admin/daily");
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

  const example = `SCORE
TITLE
DRIVE
COACH
FIELD`;

  return (
    <div>
      <PageHeader
        title="Import Word Puzzle Answers"
        description="Bulk schedule WORD daily games from a start date and one answer per line"
        action={
          <Link href="/admin/daily">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import Settings</CardTitle>
            <CardDescription>Words must be letters only (A-Z). Dates are assigned consecutively.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start date
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="words" className="text-sm font-medium">
                Answers (one per line)
              </label>
              <Textarea
                id="words"
                value={wordsInput}
                onChange={(e) => setWordsInput(e.target.value)}
                placeholder="SCORE&#10;TITLE&#10;DRIVE"
                rows={16}
                className="font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                Parsed: <span className="font-mono">{words.length}</span> words
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={validate}
                disabled={validating || !startDate || !wordsInput}
                className="flex-1 min-w-[220px]"
              >
                <FileText className="mr-2 h-4 w-4" />
                {validating ? "Validating..." : "Validate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWordsInput(example)}
              >
                Load Example
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Overwrite existing</div>
                <Button
                  type="button"
                  variant={overwriteExisting ? "default" : "outline"}
                  onClick={() => setOverwriteExisting((v) => !v)}
                  size="sm"
                >
                  {overwriteExisting ? "On" : "Off"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                If enabled, existing WORD games on those dates can be updated. Non-WORD games are never overwritten.
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Allow overwrite with attempts</div>
                <Button
                  type="button"
                  variant={allowOverwriteWithAttempts ? "default" : "outline"}
                  onClick={() => setAllowOverwriteWithAttempts((v) => !v)}
                  size="sm"
                  disabled={!overwriteExisting}
                >
                  {allowOverwriteWithAttempts ? "On" : "Off"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                By default, games that already have user attempts are left untouched.
              </div>
            </div>

            {validationResult && (
              <div
                className={`rounded-lg border p-4 ${validationResult.valid
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-red-500 bg-red-50 dark:bg-red-950"
                  }`}
              >
                <div className="flex items-start gap-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold mb-2">
                      {validationResult.valid ? "Validation passed" : "Validation failed"}
                    </div>
                    {validationResult.errors.length > 0 && (
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {validationResult.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    )}
                    {validationResult.valid && (
                      <div className="text-sm">
                        Ready to import <span className="font-mono">{preview.length}</span> games.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {validationResult?.valid && (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
                size="lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                {importing ? "Importing..." : `Import ${preview.length} Word Puzzles`}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>First 20 scheduled rows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {preview.length === 0 ? (
                <div className="text-sm text-muted-foreground">Add a start date and words to see a preview.</div>
              ) : (
                <div className="space-y-2">
                  {preview.slice(0, 20).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {row.date}
                        </Badge>
                        <span className="font-mono text-sm">{row.word}</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {row.length}
                      </Badge>
                    </div>
                  ))}
                  {preview.length > 20 && (
                    <div className="text-xs text-muted-foreground">
                      …and {preview.length - 20} more
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>How this fits the existing daily games system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                - Creates <span className="font-mono">DailyGame</span> rows with <span className="font-mono">gameType=WORD</span>
              </div>
              <div>
                - Uses the answer length to drive the in-game board size
              </div>
              <div>
                - Protects non-WORD games and (by default) games with attempts
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

