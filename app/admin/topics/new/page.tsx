"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function NewTopicPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        parentId: formData.parentId || null,
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
              <Label htmlFor="parentId">Parent Topic</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(val) => updateField("parentId", val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (root topic)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root topic)</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {"  ".repeat(topic.level)}
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave as "None" to create a top-level topic
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

