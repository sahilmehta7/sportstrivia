"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TopicSelector } from "@/components/admin/TopicSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TOPIC_SCHEMA_TYPE_LABELS, type TopicSchemaTypeValue } from "@/lib/topic-schema-options";

export default function NewTopicPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    displayEmoji: "",
    displayImageUrl: "",
    schemaType: "NONE" as TopicSchemaTypeValue,
    schemaCanonicalUrl: "",
    schemaSameAsText: "",
    sportName: "",
    leagueName: "",
    organizationName: "",
    teamName: "",
    nationality: "",
    birthDate: "",
    startDate: "",
    endDate: "",
    locationName: "",
    organizerName: "",
    aliases: "",
  });

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/admin/topics?flat=true");
      const result = await response.json();
      if (response.ok) {
        setTopics(result.data.topics);
      }
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (formData.schemaType !== "NONE" && !formData.schemaCanonicalUrl.trim()) {
        throw new Error("Schema Canonical URL is required when schema type is not None");
      }

      const data = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        parentId: formData.parentId || null,
        displayEmoji: formData.displayEmoji || null,
        displayImageUrl: formData.displayImageUrl || null,
        schemaType: formData.schemaType,
        schemaCanonicalUrl: formData.schemaCanonicalUrl || null,
        schemaSameAs: formData.schemaSameAsText
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        alternateNames: formData.aliases
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        schemaEntityData:
          formData.schemaType === "SPORT"
            ? {}
            : formData.schemaType === "SPORTS_TEAM"
              ? {
                  ...(formData.sportName ? { sportName: formData.sportName } : {}),
                  ...(formData.leagueName ? { leagueName: formData.leagueName } : {}),
                  ...(formData.organizationName ? { organizationName: formData.organizationName } : {}),
                }
              : formData.schemaType === "ATHLETE"
                ? {
                    ...(formData.sportName ? { sportName: formData.sportName } : {}),
                    ...(formData.teamName ? { teamName: formData.teamName } : {}),
                    ...(formData.nationality ? { nationality: formData.nationality } : {}),
                    ...(formData.birthDate ? { birthDate: new Date(formData.birthDate).toISOString() } : {}),
                  }
                : formData.schemaType === "SPORTS_ORGANIZATION"
                  ? {
                      ...(formData.sportName ? { sportName: formData.sportName } : {}),
                    }
                  : formData.schemaType === "SPORTS_EVENT"
                    ? {
                        ...(formData.sportName ? { sportName: formData.sportName } : {}),
                        ...(formData.startDate ? { startDate: new Date(formData.startDate).toISOString() } : {}),
                        ...(formData.endDate ? { endDate: new Date(formData.endDate).toISOString() } : {}),
                        ...(formData.locationName ? { locationName: formData.locationName } : {}),
                        ...(formData.organizerName ? { organizerName: formData.organizerName } : {}),
                      }
                    : null,
      };

      const response = await fetch("/api/admin/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create topic");
      }

      toast({
        title: "Topic created!",
        description: `${formData.name} has been created successfully.`,
      });

      router.push("/admin/topics");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === "name" && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleWikipediaAutofill = async () => {
    const query = formData.name.trim();
    if (!query) {
      toast({
        title: "Topic name required",
        description: "Enter a topic name before running Wikipedia autofill.",
        variant: "destructive",
      });
      return;
    }

    setWikiLoading(true);
    try {
      const response = await fetch("/api/admin/topics/wiki-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch Wikipedia metadata");
      }

      const meta = result.data || {};
      const existingSameAs = formData.schemaSameAsText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);
      const incomingSameAs = Array.isArray(meta.schemaSameAs)
        ? meta.schemaSameAs.map((value: string) => value.trim()).filter(Boolean)
        : [];
      const mergedSameAs = Array.from(new Set([...existingSameAs, ...incomingSameAs]));

      setFormData((prev) => ({
        ...prev,
        schemaType: (meta.schemaType || prev.schemaType) as TopicSchemaTypeValue,
        schemaCanonicalUrl: meta.schemaCanonicalUrl || prev.schemaCanonicalUrl,
        schemaSameAsText: mergedSameAs.join("\n"),
        description: prev.description || meta.extract || meta.description || "",
        sportName: meta.sportName || prev.sportName,
        leagueName: meta.leagueName || prev.leagueName,
        organizationName: meta.organizationName || prev.organizationName,
        teamName: meta.teamName || prev.teamName,
        nationality: meta.nationality || prev.nationality,
        birthDate: meta.birthDate || prev.birthDate,
        startDate: meta.startDate || prev.startDate,
        endDate: meta.endDate || prev.endDate,
        locationName: meta.locationName || prev.locationName,
        organizerName: meta.organizerName || prev.organizerName,
        aliases:
          prev.aliases ||
          (Array.isArray(meta.aliases) ? meta.aliases.join(", ") : ""),
      }));

      toast({
        title: "Wikipedia metadata loaded",
        description: "Schema fields were auto-filled. Review before saving.",
      });
    } catch (error: any) {
      toast({
        title: "Wikipedia lookup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWikiLoading(false);
    }
  };

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
        title="Create New Topic"
        description="Add a new topic to the hierarchy"
        action={
          <Link href="/admin/topics">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topics
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Topic Information</CardTitle>
            <CardDescription>
              Create a new topic for organizing questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., NBA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="e.g., nba"
                required
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (lowercase, hyphens)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayEmoji">Display Emoji</Label>
              <Input
                id="displayEmoji"
                placeholder="e.g., 🏀"
                value={formData.displayEmoji}
                onChange={(e) => updateField("displayEmoji", e.target.value)}
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">Optional. Single emoji recommended.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayImageUrl">Display Image URL</Label>
              <Input
                id="displayImageUrl"
                placeholder="https://..."
                value={formData.displayImageUrl}
                onChange={(e) => updateField("displayImageUrl", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">Optional. Used when you prefer an image over emoji.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief description of this topic..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemaType">Schema Type</Label>
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleWikipediaAutofill}
                  disabled={wikiLoading}
                >
                  {wikiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Wikipedia Autofill
                    </>
                  )}
                </Button>
              </div>
              <Select
                value={formData.schemaType}
                onValueChange={(value) => updateField("schemaType", value as TopicSchemaTypeValue)}
              >
                <SelectTrigger id="schemaType">
                  <SelectValue placeholder="Select schema type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOPIC_SCHEMA_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemaCanonicalUrl">Schema Canonical URL</Label>
              <Input
                id="schemaCanonicalUrl"
                placeholder="https://en.wikipedia.org/wiki/..."
                value={formData.schemaCanonicalUrl}
                onChange={(e) => updateField("schemaCanonicalUrl", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Required when schema type is not &quot;None&quot;.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemaSameAsText">sameAs URLs</Label>
              <Textarea
                id="schemaSameAsText"
                rows={3}
                placeholder={"https://www.wikidata.org/wiki/...\nhttps://www.official-site.com/..."}
                value={formData.schemaSameAsText}
                onChange={(e) => updateField("schemaSameAsText", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">One URL per line.</p>
            </div>

            {formData.schemaType === "SPORT" && (
            <div className="space-y-2">
              <Label htmlFor="aliases">Alternate names</Label>
              <Input
                id="aliases"
                placeholder="Soccer, Association Football"
                value={formData.aliases}
                onChange={(e) => updateField("aliases", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Optional search aliases, comma separated.</p>
            </div>
            )}

            {(formData.schemaType === "SPORTS_TEAM" ||
              formData.schemaType === "ATHLETE" ||
              formData.schemaType === "SPORTS_ORGANIZATION" ||
              formData.schemaType === "SPORTS_EVENT") && (
              <div className="space-y-2">
                <Label htmlFor="sportName">Sport Name</Label>
                <Input
                  id="sportName"
                  placeholder="Cricket"
                  value={formData.sportName}
                  onChange={(e) => updateField("sportName", e.target.value)}
                />
              </div>
            )}

            {formData.schemaType === "SPORTS_TEAM" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="leagueName">League Name</Label>
                  <Input
                    id="leagueName"
                    placeholder="Indian Premier League"
                    value={formData.leagueName}
                    onChange={(e) => updateField("leagueName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    placeholder="Board of Control for Cricket in India"
                    value={formData.organizationName}
                    onChange={(e) => updateField("organizationName", e.target.value)}
                  />
                </div>
              </>
            )}

            {formData.schemaType === "ATHLETE" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="India National Cricket Team"
                    value={formData.teamName}
                    onChange={(e) => updateField("teamName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Indian"
                    value={formData.nationality}
                    onChange={(e) => updateField("nationality", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                  />
                </div>
              </>
            )}

            {formData.schemaType === "SPORTS_EVENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationName">Location Name</Label>
                  <Input
                    id="locationName"
                    placeholder="Wankhede Stadium"
                    value={formData.locationName}
                    onChange={(e) => updateField("locationName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizerName">Organizer Name</Label>
                  <Input
                    id="organizerName"
                    placeholder="ICC"
                    value={formData.organizerName}
                    onChange={(e) => updateField("organizerName", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Topic</Label>
              <TopicSelector
                topics={[{ id: "none", name: "None (root topic)", level: 0 }, ...topics]}
                value={formData.parentId || "none"}
                onChange={(val) => updateField("parentId", val === "none" ? "" : val)}
                placeholder="Select parent topic (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Leave as &quot;None&quot; to create a top-level topic
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{formData.name || "Not set"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Slug:</span>{" "}
              <code className="bg-background px-1 rounded">{formData.slug || "not-set"}</code>
            </div>
            <div>
              <span className="text-muted-foreground">Level:</span>{" "}
              {formData.parentId
                ? `${(topics.find((t) => t.id === formData.parentId)?.level || 0) + 1}`
                : "0 (root)"}
            </div>
            {formData.parentId && (
              <div>
                <span className="text-muted-foreground">Parent:</span>{" "}
                {topics.find((t) => t.id === formData.parentId)?.name}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/admin/topics">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Creating..." : "Create Topic"}
          </Button>
        </div>
      </form>
    </div>
  );
}
