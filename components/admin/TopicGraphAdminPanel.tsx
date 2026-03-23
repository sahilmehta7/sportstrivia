"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const RELATION_TYPES = [
  "BELONGS_TO_SPORT",
  "PLAYS_FOR",
  "REPRESENTS",
  "COMPETES_IN",
  "ORGANIZED_BY",
  "RIVAL_OF",
  "RELATED_TO",
] as const;

type TopicOption = {
  id: string;
  name: string;
  slug: string;
};

type TopicGraphAdminPanelProps = {
  topicId: string;
  topics: TopicOption[];
};

export function TopicGraphAdminPanel({ topicId, topics }: TopicGraphAdminPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [relationType, setRelationType] =
    useState<(typeof RELATION_TYPES)[number]>("BELONGS_TO_SPORT");
  const [relatedTopicId, setRelatedTopicId] = useState("");
  const [relations, setRelations] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<{
    isReady: boolean;
    entityStatus: string;
    errors: string[];
  } | null>(null);

  const topicOptions = useMemo(
    () => topics.filter((topic) => topic.id !== topicId),
    [topicId, topics]
  );

  const loadPanelData = async () => {
    try {
      setLoading(true);
      const [relationsResponse, readinessResponse] = await Promise.all([
        fetch(`/api/admin/topics/${topicId}/relations`),
        fetch(`/api/admin/topics/${topicId}/readiness`),
      ]);

      const relationsResult = await relationsResponse.json();
      const readinessResult = await readinessResponse.json();

      if (!relationsResponse.ok || !readinessResponse.ok) {
        throw new Error("Failed to load topic graph data");
      }

      setRelations(relationsResult.data.relations ?? []);
      setReadiness(readinessResult.data ?? null);
    } catch (error: any) {
      toast({
        title: "Topic graph unavailable",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!topicId) return;
    loadPanelData();
  }, [topicId]);

  const handleCreateRelation = async () => {
    if (!relatedTopicId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/topics/${topicId}/relations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toTopicId: relatedTopicId,
          relationType,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create relation");
      }

      setRelatedTopicId("");
      await loadPanelData();
      toast({
        title: "Relation saved",
        description: "Topic graph updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Relation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      const response = await fetch(`/api/admin/topics/${topicId}/relations/${relationId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete relation");
      }

      await loadPanelData();
      toast({
        title: "Relation removed",
        description: "Topic graph updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entity Graph</CardTitle>
        <CardDescription>
          Manage current-state topic relations and inspect entity readiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Readiness</Label>
          <Input
            readOnly
            value={
              loading || !readiness
                ? "Loading..."
                : readiness.isReady
                  ? `${readiness.entityStatus} - ready`
                  : `${readiness.entityStatus} - needs review`
            }
          />
          {readiness && readiness.errors.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {readiness.errors.map((error) => (
                <li key={error}>• {error}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="relation-type">Relation type</Label>
            <select
              id="relation-type"
              value={relationType}
              onChange={(event) =>
                setRelationType(event.target.value as (typeof RELATION_TYPES)[number])
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {RELATION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="related-topic">Related topic</Label>
            <select
              id="related-topic"
              value={relatedTopicId}
              onChange={(event) => setRelatedTopicId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a topic</option>
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="button" onClick={handleCreateRelation} disabled={saving || !relatedTopicId}>
              Add relation
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Current relations</Label>
          {relations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No relations configured yet.</p>
          ) : (
            relations.map((relation) => (
              <div
                key={relation.id}
                className="flex items-center justify-between rounded-md border border-border px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{relation.relationType}</p>
                  <p className="text-xs text-muted-foreground">
                    {relation.fromTopicId} → {relation.toTopicId}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRelation(relation.id)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
