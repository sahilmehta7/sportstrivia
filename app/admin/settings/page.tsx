"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, AlertCircle, RefreshCw, Globe } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [storedInDatabase, setStoredInDatabase] = useState(false);
  
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [originalModel, setOriginalModel] = useState("gpt-4o");
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load all settings
      const response = await fetch("/api/admin/settings");
      const result = await response.json();

      if (response.ok && result.data.settings) {
        // Load AI prompt setting
        const promptSetting = result.data.settings.find((s: any) => s.key === "ai_quiz_prompt");
        if (promptSetting) {
          setAiPrompt(promptSetting.value);
          setOriginalPrompt(promptSetting.value);
          setIsDefault(promptSetting.isDefault);
        }

        // Load AI model setting
        const modelSetting = result.data.settings.find((s: any) => s.key === "ai_model");
        if (modelSetting) {
          setAiModel(modelSetting.value);
          setOriginalModel(modelSetting.value);
          setAvailableModels(modelSetting.availableModels || []);
        }

        let promptPersisted = false;
        try {
          const promptMetaResponse = await fetch("/api/admin/settings?key=ai_quiz_prompt");
          const promptMetaResult = await promptMetaResponse.json();
          if (promptMetaResponse.ok && promptMetaResult?.data) {
            promptPersisted = Boolean(promptMetaResult.data.storedInDatabase);
          }
        } catch {
          promptPersisted = Boolean(promptSetting?.storedInDatabase);
        }

        setStoredInDatabase(promptPersisted);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "ai_quiz_prompt",
          value: aiPrompt,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if it's a migration error
        if (result.error?.includes('does not exist') || result.error?.includes('db push')) {
          setMigrationNeeded(true);
        }
        throw new Error(result.error || "Failed to save settings");
      }

      setOriginalPrompt(aiPrompt);
      setIsDefault(false);
      setMigrationNeeded(false);
      setStoredInDatabase(true);

      toast({
        title: "Settings saved!",
        description: "AI Quiz Generator prompt has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset to default prompt? This will discard your custom prompt.")) {
      return;
    }

    setResetting(true);

    try {
      const response = await fetch("/api/admin/settings?key=ai_quiz_prompt", {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset settings");
      }

      // Reload to get default
      await loadSettings();

      toast({
        title: "Reset successful!",
        description: "Prompt has been reset to default",
      });
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleSaveModel = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "ai_model",
          value: aiModel,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes('does not exist') || result.error?.includes('db push')) {
          setMigrationNeeded(true);
        }
        throw new Error(result.error || "Failed to save model setting");
      }

      setOriginalModel(aiModel);
      setMigrationNeeded(false);

      toast({
        title: "Model updated!",
        description: `Now using ${aiModel} for quiz generation`,
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSitemap = async () => {
    setRegenerating(true);

    try {
      const response = await fetch("/api/admin/sitemap", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to regenerate sitemap");
      }

      toast({
        title: "Sitemap regenerated!",
        description: "The sitemap has been successfully regenerated",
      });
    } catch (error: any) {
      toast({
        title: "Regeneration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const hasChanges = aiPrompt !== originalPrompt;
  const hasModelChanges = aiModel !== originalModel;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure application settings and preferences"
      />

      <div className="space-y-6">
        {/* Migration Warning */}
        {migrationNeeded && (
          <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Migration Required</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                The AppSettings table does not exist yet. To enable saving custom settings, run:
              </p>
              <pre className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded text-xs font-mono">
                npx prisma db push
              </pre>
              <p className="mt-2 text-xs">
                The AI Quiz Generator will continue to work using the default prompt until the migration is applied.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* AI Model Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Model Selection
                  {hasModelChanges && (
                    <Badge variant="secondary" className="text-xs">
                      Unsaved Changes
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Select which OpenAI model to use for quiz generation
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleSaveModel}
                disabled={saving || !hasModelChanges}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Model"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model: any) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span>{model.label}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Different models have different capabilities, speeds, and costs
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium mb-1">Current Model</p>
                <p className="text-muted-foreground font-mono text-xs">{aiModel}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium mb-1">Status</p>
                <p className="text-muted-foreground text-xs">
                  {aiModel === "gpt-4o" ? "Default (Recommended)" : "Custom Selection"}
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Model Comparison & Recommendations</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">Recommended for Quiz Generation:</p>
                    <div className="ml-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono">gpt-5</span>
                        <span className="text-muted-foreground">🆕 Latest flagship (Aug 2025)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono">gpt-4o</span>
                        <span className="text-muted-foreground">Best proven quality/speed balance</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono">gpt-4o-mini</span>
                        <span className="text-muted-foreground">Most cost-effective</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-4 gap-2 font-semibold">
                      <span>Model</span>
                      <span>Context</span>
                      <span>Speed</span>
                      <span>Cost</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-1 font-semibold text-green-700 dark:text-green-400">
                      <span>GPT-5 🆕</span>
                      <span>TBD</span>
                      <span>⚡⚡ Fast</span>
                      <span>💰💰 TBD</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <span>GPT-4o</span>
                      <span>128K</span>
                      <span>⚡⚡ Fast</span>
                      <span>💰💰 Med</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <span>GPT-4o Mini</span>
                      <span>128K</span>
                      <span>⚡⚡⚡ Fastest</span>
                      <span>💰 Low</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <span>o1</span>
                      <span>200K</span>
                      <span>⏱️ Slow</span>
                      <span>💰💰💰 High</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <span>GPT-4 Turbo</span>
                      <span>128K</span>
                      <span>⚡ Medium</span>
                      <span>💰💰💰 High</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <span>GPT-3.5</span>
                      <span>16K</span>
                      <span>⚡⚡ Fast</span>
                      <span>💰 Very Low</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t text-muted-foreground space-y-1">
                    <p>💡 <strong>Tip:</strong> GPT-5 is the latest flagship with enhanced reasoning. GPT-4o is still excellent and proven.</p>
                    <p>⚠️ <strong>Note:</strong> o1 models don&apos;t support JSON mode - may occasionally fail parsing. Use GPT-5 or GPT-4o for reliable quiz generation.</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Separator />

        {/* Sitemap Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sitemap Management
            </CardTitle>
            <CardDescription>
              Regenerate the sitemap to update search engine indexing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>About Sitemaps</AlertTitle>
              <AlertDescription>
                <p className="text-sm">
                  The sitemap helps search engines discover and index all your quizzes, topics, and pages. 
                  Regenerate it after adding new content or making significant changes to your site structure.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-xs text-muted-foreground">
                  Sitemap is automatically generated from your published content
                </p>
              </div>
              <Button
                onClick={handleRegenerateSitemap}
                disabled={regenerating}
                variant="outline"
              >
                {regenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Sitemap
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-2">
              <p>💡 <strong>Tip:</strong> The sitemap includes:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>All published quizzes</li>
                <li>All topics</li>
                <li>Main pages (Home, Leaderboard, etc.)</li>
                <li>Updated timestamps for search engines</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* AI Quiz Generator Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Quiz Generator Prompt
                  {isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {hasChanges && (
                    <Badge variant="secondary" className="text-xs">
                      Unsaved Changes
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Customize the prompt template used for generating quizzes with AI
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={resetting || isDefault}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {resetting ? "Resetting..." : "Reset to Default"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Available Placeholders</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm font-mono">
                  <div><code className="bg-muted px-1 rounded">{"{{TOPIC}}"}</code> - Topic name</div>
                  <div><code className="bg-muted px-1 rounded">{"{{TOPIC_LOWER}}"}</code> - Lowercase topic name</div>
                  <div><code className="bg-muted px-1 rounded">{"{{SLUGIFIED_TOPIC}}"}</code> - URL-friendly topic slug</div>
                  <div><code className="bg-muted px-1 rounded">{"{{SPORT}}"}</code> - Sport category</div>
                  <div><code className="bg-muted px-1 rounded">{"{{DIFFICULTY}}"}</code> - Overall difficulty (EASY/MEDIUM/HARD)</div>
                  <div><code className="bg-muted px-1 rounded">{"{{NUM_QUESTIONS}}"}</code> - Number of questions to generate</div>
                  <div><code className="bg-muted px-1 rounded">{"{{DURATION}}"}</code> - Quiz duration in seconds</div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={25}
                className="font-mono text-sm"
                placeholder="Enter your custom prompt template..."
              />
              <p className="text-xs text-muted-foreground">
                This prompt is sent to OpenAI when generating quizzes. Placeholders will be replaced with actual values.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Prompt Status</p>
                <p className="text-xs text-muted-foreground">
                  {isDefault ? "Using default prompt template" : "Using custom prompt template"}
                </p>
                {!storedInDatabase && !isDefault && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    ⚠️ Not persisted (migration needed)
                  </p>
                )}
                {storedInDatabase && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✅ Saved in database
                  </p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Characters: {aiPrompt.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Settings Sections */}
        <Card>
          <CardHeader>
            <CardTitle>More Settings Coming Soon</CardTitle>
            <CardDescription>
              Additional configuration options will be added here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Future settings may include:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Default quiz configuration</li>
                <li>Email notification templates</li>
                <li>Leaderboard display options</li>
                <li>Badge criteria configuration</li>
                <li>Platform branding</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
