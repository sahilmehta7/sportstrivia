"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type TopicOption = {
  id: string;
  name: string;
  slug: string;
  schemaType: string;
  entityStatus?: string;
};

type InterestResponse = {
  data: {
    interests: Array<{
      topicId: string;
      slug: string;
      name: string;
      schemaType: string;
      source: string;
      strength: number;
      topic?: TopicOption;
    }>;
    preferences: {
      preferredDifficulty: string | null;
      preferredPlayModes: string[];
    };
  };
};

type TopicsResponse = {
  data: {
    topics: TopicOption[];
  };
};

export function ProfileDiscoverabilityPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [allTopics, setAllTopics] = useState<TopicOption[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<TopicOption[]>([]);
  const [preferredDifficulty, setPreferredDifficulty] = useState<string>("");
  const [preferredPlayModes, setPreferredPlayModes] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [interestsResponse, topicsResponse] = await Promise.all([
          fetch("/api/users/me/interests"),
          fetch("/api/topics?limit=300"),
        ]);

        const interestsResult = (await interestsResponse.json()) as InterestResponse;
        const topicsResult = (await topicsResponse.json()) as TopicsResponse;

        if (!interestsResponse.ok || !topicsResponse.ok) {
          throw new Error("Failed to load discoverability preferences");
        }

        const topicMap = new Map(topicsResult.data.topics.map((topic) => [topic.id, topic]));
        const explicit = interestsResult.data.interests
          .map((interest) => topicMap.get(interest.topicId) ?? interest.topic)
          .filter((topic): topic is TopicOption => Boolean(topic));

        setAllTopics(topicsResult.data.topics);
        setSelectedTopics(explicit);
        setPreferredDifficulty(interestsResult.data.preferences.preferredDifficulty ?? "");
        setPreferredPlayModes(interestsResult.data.preferences.preferredPlayModes ?? []);
      } catch (error: any) {
        toast({
          title: "Unable to load interests",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [toast]);

  const followedTopics = useMemo(() => selectedTopics, [selectedTopics]);

  const filteredOptions = useMemo(() => {
    const selectedIds = new Set(selectedTopics.map((topic) => topic.id));
    const normalized = topicSearch.trim().toLowerCase();

    return allTopics
      .filter((topic) => !selectedIds.has(topic.id))
      .filter((topic) => {
        if (!normalized) return topic.schemaType === "SPORT";
        return (
          topic.name.toLowerCase().includes(normalized) ||
          topic.slug.toLowerCase().includes(normalized)
        );
      })
      .slice(0, 12);
  }, [allTopics, selectedTopics, topicSearch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/users/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds: selectedTopics.map((topic) => topic.id),
          source: "PROFILE",
          preferences: {
            preferredDifficulty: preferredDifficulty || null,
            preferredPlayModes,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save discoverability preferences");
      }

      toast({
        title: "Preferences saved",
        description: "Your interests and discovery settings were updated.",
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

  const handlePlayModeChange = (playMode: string, checked: boolean) => {
    setPreferredPlayModes((current) => {
      if (checked) {
        return current.includes(playMode) ? current : [...current, playMode];
      }

      return current.filter((value) => value !== playMode);
    });
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>Discoverability</CardTitle>
        <CardDescription>
          Tune your sports interests and follow graph to improve recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Followed entities</Label>
          <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-input bg-background/60 p-3">
            {loading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : followedTopics.length > 0 ? (
              followedTopics.map((entry) => (
                <Badge key={entry.id} variant="outline" className="rounded-full px-3 py-1">
                  {entry.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No followed topics yet</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="interest-search">Add interests</Label>
          <Input
            id="interest-search"
            value={topicSearch}
            onChange={(event) => setTopicSearch(event.target.value)}
            placeholder="Search sports, teams, athletes, events"
          />

          <div className="grid gap-2">
            {filteredOptions.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopics((current) => [...current, topic])}
                className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-left text-sm transition hover:border-primary/60"
              >
                <span className="font-medium text-foreground">{topic.name}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {topic.schemaType.replace("SPORTS_", "")}
                </span>
              </button>
            ))}
            {!loading && filteredOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">No topics match your query.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Selected interests</Label>
          <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-input bg-background/60 p-3">
            {selectedTopics.length > 0 ? (
              selectedTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() =>
                    setSelectedTopics((current) => current.filter((entry) => entry.id !== topic.id))
                  }
                  className="min-h-11 rounded-full border border-primary/40 px-3 py-1 text-sm font-medium text-primary transition hover:bg-primary/10"
                  aria-label={`Remove ${topic.name}`}
                >
                  {topic.name} ×
                </button>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No explicit interests yet</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred-difficulty">Preferred difficulty</Label>
          <select
            id="preferred-difficulty"
            value={preferredDifficulty}
            onChange={(event) => setPreferredDifficulty(event.target.value)}
            className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Preferred play modes</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {["STANDARD", "GRID_3X3"].map((playMode) => (
              <label
                key={playMode}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={preferredPlayModes.includes(playMode)}
                  onChange={(event) => handlePlayModeChange(playMode, event.target.checked)}
                />
                <span>{playMode}</span>
              </label>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="min-h-11 w-full rounded-xl sm:w-auto"
        >
          {saving ? "Saving..." : "Save discoverability preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
