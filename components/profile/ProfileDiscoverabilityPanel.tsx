"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type InterestResponse = {
  data: {
    interests: Array<{
      topicId: string;
      source: string;
      strength: number;
      topic: {
        id: string;
        name: string;
        slug: string;
        schemaType: string;
      };
    }>;
    preferences: {
      preferredDifficulty: string | null;
      preferredPlayModes: string[];
    };
  };
};

type FollowsResponse = {
  data: {
    follows: Array<{
      topic: {
        id: string;
        name: string;
        slug: string;
        schemaType: string;
      };
    }>;
  };
};

export function ProfileDiscoverabilityPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interestTopicIds, setInterestTopicIds] = useState("");
  const [preferredDifficulty, setPreferredDifficulty] = useState<string>("");
  const [preferredPlayModes, setPreferredPlayModes] = useState<string[]>([]);
  const [follows, setFollows] = useState<FollowsResponse["data"]["follows"]>([]);
  const [interestNames, setInterestNames] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [interestsResponse, followsResponse] = await Promise.all([
          fetch("/api/users/me/interests"),
          fetch("/api/users/me/follows"),
        ]);

        const interestsResult = (await interestsResponse.json()) as InterestResponse;
        const followsResult = (await followsResponse.json()) as FollowsResponse;

        if (!interestsResponse.ok || !followsResponse.ok) {
          throw new Error("Failed to load discoverability preferences");
        }

        setInterestTopicIds(
          interestsResult.data.interests.map((interest) => interest.topicId).join(",")
        );
        setInterestNames(
          interestsResult.data.interests.map((interest) => interest.topic.name)
        );
        setPreferredDifficulty(interestsResult.data.preferences.preferredDifficulty ?? "");
        setPreferredPlayModes(interestsResult.data.preferences.preferredPlayModes ?? []);
        setFollows(followsResult.data.follows);
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

  const followedNames = useMemo(
    () => follows.map((follow) => follow.topic.name).join(", "),
    [follows]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const interests = interestTopicIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((topicId) => ({
          topicId,
          source: "PROFILE" as const,
          strength: 1,
        }));

      const response = await fetch("/api/users/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests,
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
          Manage explicit interests, followed entities, and quiz mode preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="followed-entities">Followed entities</Label>
          <Input
            id="followed-entities"
            value={loading ? "Loading..." : followedNames || "No followed topics yet"}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest-names">Current interest names</Label>
          <Input
            id="interest-names"
            value={loading ? "Loading..." : interestNames.join(", ") || "No explicit interests yet"}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest-topic-ids">Interest topic IDs</Label>
          <Textarea
            id="interest-topic-ids"
            value={interestTopicIds}
            onChange={(event) => setInterestTopicIds(event.target.value)}
            placeholder="sport_cricket,team_india"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred-difficulty">Preferred difficulty</Label>
          <select
            id="preferred-difficulty"
            value={preferredDifficulty}
            onChange={(event) => setPreferredDifficulty(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Preferred play modes</Label>
          <div className="flex flex-wrap gap-4 text-sm">
            {["STANDARD", "GRID_3X3"].map((playMode) => (
              <label key={playMode} className="flex items-center gap-2">
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

        <Button type="button" onClick={handleSave} disabled={saving || loading}>
          Save discoverability preferences
        </Button>
      </CardContent>
    </Card>
  );
}
