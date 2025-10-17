"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileJson, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TopicConflict {
  name: string;
  slug: string;
  existingParent: string | null;
  newParent: string | null;
  action: "skip" | "update_parent" | "create";
}

export default function TopicImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [conflicts, setConflicts] = useState<TopicConflict[]>([]);
  const [overwriteParents, setOverwriteParents] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const validateJSON = () => {
    setValidating(true);
    setValidationResult(null);
    setPreview(null);
    setConflicts([]);
    setImportResult(null);

    try {
      const parsed = JSON.parse(jsonInput);
      
      // Basic validation
      const errors: string[] = [];
      
      if (!parsed.topics || !Array.isArray(parsed.topics)) {
        errors.push("Topics array is required");
      }
      if (parsed.topics && parsed.topics.length === 0) {
        errors.push("At least one topic is required");
      }

      // Validate each topic
      parsed.topics?.forEach((t: any, idx: number) => {
        if (!t.name) errors.push(`Topic ${idx + 1}: name is required`);
        if (t.name && t.name.length > 100) {
          errors.push(`Topic ${idx + 1}: name too long (max 100 characters)`);
        }
      });

      // Check for duplicate names in import
      const names = new Set<string>();
      parsed.topics?.forEach((t: any, idx: number) => {
        const normalized = t.name?.toLowerCase();
        if (normalized) {
          if (names.has(normalized)) {
            errors.push(`Topic ${idx + 1}: duplicate name "${t.name}"`);
          }
          names.add(normalized);
        }
      });

      // Check for circular dependencies
      const circularCheck = checkCircularDependencies(parsed.topics || []);
      if (circularCheck.length > 0) {
        errors.push(...circularCheck);
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

  const checkCircularDependencies = (topics: any[]): string[] => {
    const errors: string[] = [];
    const topicMap = new Map(topics.map((t: any) => [t.name?.toLowerCase(), t]));

    for (const topic of topics) {
      const visited = new Set<string>();
      let current = topic;
      
      while (current?.parentName) {
        const parentKey = current.parentName.toLowerCase();
        
        if (visited.has(parentKey)) {
          errors.push(`Circular dependency detected: ${topic.name} → ${current.parentName}`);
          break;
        }
        
        visited.add(parentKey);
        current = topicMap.get(parentKey);
        
        if (!current) break; // Parent not in import, will be validated by backend
      }
    }

    return errors;
  };

  const handleImport = async () => {
    if (!preview) return;

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/admin/topics/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: preview.topics,
          overwriteParents,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import topics");
      }

      // Check if user action is required (conflicts detected)
      if (result.data.requiresUserAction) {
        setConflicts(result.data.conflicts);
        toast({
          title: "Conflicts detected",
          description: "Some topics already exist with different parents. Review conflicts below.",
          variant: "default",
        });
        return;
      }

      // Import successful
      setImportResult(result.data);
      
      toast({
        title: "Import successful!",
        description: result.data.message || "Topics imported successfully",
      });

      // Clear form after successful import
      if (result.data.errors.length === 0) {
        setTimeout(() => {
          router.push("/admin/topics");
        }, 2000);
      }
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
    topics: [
      {
        name: "Cricket",
        slug: "cricket",
        description: "All about cricket",
      },
      {
        name: "IPL",
        slug: "ipl",
        description: "Indian Premier League",
        parentName: "Cricket",
      },
      {
        name: "Test Cricket",
        slug: "test-cricket",
        description: "Test match cricket",
        parentName: "Cricket",
      },
      {
        name: "Basketball",
        slug: "basketball",
        description: "Basketball topics",
      },
      {
        name: "NBA",
        slug: "nba",
        description: "National Basketball Association",
        parentName: "Basketball",
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title="Import Topics from JSON"
        description="Bulk create topics with hierarchical relationships"
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
              <div className={`rounded-lg border p-4 ${
                validationResult.valid 
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

            {/* Overwrite Option */}
            {validationResult?.valid && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="overwrite">Update Parent for Existing Topics</Label>
                  <p className="text-sm text-muted-foreground">
                    If enabled, existing topics will be moved to new parents
                  </p>
                </div>
                <Switch
                  id="overwrite"
                  checked={overwriteParents}
                  onCheckedChange={setOverwriteParents}
                />
              </div>
            )}

            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Conflicts Detected</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    {conflicts.filter(c => c.action !== "create").map((conflict, idx) => (
                      <div key={idx} className="text-sm">
                        <strong>{conflict.name}</strong>
                        {conflict.existingParent !== conflict.newParent && (
                          <div className="ml-4 text-muted-foreground">
                            Current parent: {conflict.existingParent || "None"} →{" "}
                            New parent: {conflict.newParent || "None"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm">
                    {overwriteParents 
                      ? "Parents will be updated when you import."
                      : "Enable 'Update Parent' to change parents, or disable to skip existing topics."
                    }
                  </p>
                </AlertDescription>
              </Alert>
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
                {importing ? "Importing..." : "Import Topics"}
              </Button>
            )}

            {/* Import Result */}
            {importResult && (
              <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Import Complete</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>✅ Created: {importResult.created}</div>
                    <div>⏭️ Skipped: {importResult.skipped}</div>
                    <div>🔄 Updated: {importResult.updated}</div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <strong className="text-red-600">Errors:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {importResult.errors.map((error: string, idx: number) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
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
                  <h3 className="font-semibold text-lg mb-2">
                    Topics ({preview.topics.length})
                  </h3>
                  <div className="space-y-2">
                    {preview.topics.map((topic: any, idx: number) => (
                      <div key={idx} className="text-sm border rounded p-3">
                        <div className="font-medium flex items-center gap-2">
                          {topic.parentName && (
                            <span className="text-muted-foreground text-xs">
                              {"  ".repeat(countParentDepth(topic, preview.topics))}↳
                            </span>
                          )}
                          {topic.name}
                        </div>
                        {topic.description && (
                          <div className="text-muted-foreground text-xs mt-1">
                            {topic.description}
                          </div>
                        )}
                        {topic.parentName && (
                          <div className="text-muted-foreground text-xs mt-1">
                            Parent: {topic.parentName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>JSON Format</CardTitle>
              <CardDescription>Required structure for topic import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Required Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="text-xs">topics[]</code> - Array of topics</li>
                    <li><code className="text-xs">topics[].name</code> - Topic name (max 100 chars)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Optional Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="text-xs">slug</code> - URL slug (auto-generated if not provided)</li>
                    <li><code className="text-xs">description</code> - Topic description</li>
                    <li><code className="text-xs">parentName</code> - Parent topic name (for hierarchy)</li>
                    <li><code className="text-xs">parentSlug</code> - Or reference parent by slug</li>
                    <li><code className="text-xs">imageUrl</code> - Topic image URL</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Structure</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "topics": [
    {
      "name": "Cricket",
      "slug": "cricket",
      "description": "All about cricket"
    },
    {
      "name": "IPL",
      "slug": "ipl",
      "description": "Indian Premier League",
      "parentName": "Cricket"
    },
    {
      "name": "Test Cricket",
      "description": "Test match format",
      "parentName": "Cricket"
    }
  ]
}`}
                  </pre>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Hierarchical Structure
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                    <li>Parents are automatically created before children</li>
                    <li>Reference parents by name using <code>parentName</code></li>
                    <li>Or by slug using <code>parentSlug</code></li>
                    <li>Level is auto-calculated based on parent depth</li>
                    <li>Circular dependencies are prevented</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Existing Topics
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                    <li>Existing topics are skipped by default</li>
                    <li>Enable &quot;Update Parent&quot; to change parent for existing topics</li>
                    <li>Conflicts are shown before import for review</li>
                    <li>Names are case-insensitive (Cricket = cricket = CRICKET)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper to count depth for visual indentation
function countParentDepth(topic: any, allTopics: any[]): number {
  let depth = 0;
  let current = topic;
  const topicMap = new Map(allTopics.map((t: any) => [t.name?.toLowerCase(), t]));

  while (current?.parentName) {
    depth++;
    current = topicMap.get(current.parentName.toLowerCase());
    if (!current || depth > 10) break; // Prevent infinite loops
  }

  return depth;
}

