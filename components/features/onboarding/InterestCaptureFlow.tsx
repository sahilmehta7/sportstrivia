"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

const TOPICS_FETCH_LIMIT = 5000;
const FOLLOWABLE_SCHEMA_TYPES = new Set([
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_EVENT",
  "SPORTS_ORGANIZATION",
]);

type TopicNode = {
  id: string;
  name: string;
  slug: string;
  schemaType: string;
  parentId: string | null;
  entityStatus?: string;
};

type TopicFlatResponse = {
  data: {
    topics: TopicNode[];
  };
};

type InterestCaptureFlowProps = {
  onSkip: () => void;
  onComplete: () => void;
};

function isReadyFollowableTopic(topic: TopicNode) {
  return FOLLOWABLE_SCHEMA_TYPES.has(topic.schemaType) && topic.entityStatus === "READY";
}

function resolveAncestorSportId(topicId: string, byId: Map<string, TopicNode>): string | null {
  const seen = new Set<string>();
  let current = byId.get(topicId);

  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);

    if (current.schemaType === "SPORT") return current.id;
    if (!current.parentId) return null;

    current = byId.get(current.parentId);
  }

  return null;
}

export function InterestCaptureFlow({ onSkip, onComplete }: InterestCaptureFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [sports, setSports] = useState<TopicNode[]>([]);
  const [entities, setEntities] = useState<TopicNode[]>([]);
  const [topicsById, setTopicsById] = useState<Map<string, TopicNode>>(new Map());
  const [selectedSports, setSelectedSports] = useState<TopicNode[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<TopicNode[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [noEligibleSports, setNoEligibleSports] = useState(false);

  const loadTopics = async () => {
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    setNoEligibleSports(false);

    try {
      const response = await fetch(`/api/topics?limit=${TOPICS_FETCH_LIMIT}`);
      if (!response.ok) {
        throw new Error("Unable to load sports topics");
      }

      const payload = (await response.json()) as TopicFlatResponse;
      const allTopics = payload.data.topics ?? [];
      const eligibleTopics = allTopics.filter(isReadyFollowableTopic);
      const nextSports = eligibleTopics.filter((topic) => topic.schemaType === "SPORT");

      if (nextSports.length === 0) {
        setNoEligibleSports(true);
        setSports([]);
        setEntities([]);
        setTopicsById(new Map());
        setSelectedSports([]);
        setSelectedEntities([]);
        return;
      }

      const nextEntities = eligibleTopics.filter((topic) => topic.schemaType !== "SPORT");
      setSports(nextSports);
      setEntities(nextEntities);
      setTopicsById(new Map(allTopics.map((topic) => [topic.id, topic])));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load interests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const selectedSportIds = useMemo(
    () => new Set(selectedSports.map((sport) => sport.id)),
    [selectedSports]
  );

  const entityOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return entities
      .filter((entity) => {
        if (selectedSportIds.size === 0) return true;
        const ancestorSportId = resolveAncestorSportId(entity.id, topicsById);
        return ancestorSportId ? selectedSportIds.has(ancestorSportId) : false;
      })
      .filter((entity) => {
        if (!normalized) return true;
        return (
          entity.name.toLowerCase().includes(normalized) ||
          entity.slug.toLowerCase().includes(normalized)
        );
      })
      .slice(0, 24);
  }, [entities, query, selectedSportIds, topicsById]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const topicIds = Array.from(
        new Set([
          ...selectedSports.map((topic) => topic.id),
          ...selectedEntities.map((topic) => topic.id),
        ])
      );

      const response = await fetch("/api/users/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds,
          source: "ONBOARDING",
          preferences: {
            preferredDifficulty: null,
            preferredPlayModes: ["STANDARD"],
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof payload?.error === "string" && payload.error.trim().length > 0
            ? payload.error
            : "Unable to save preferences. Please try again.";
        setSaveError(errorMessage);
        return;
      }

      onComplete();
    } catch {
      setSaveError("Unable to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-end p-4 sm:justify-center">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-athletic">
            <div className="mb-4 flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <h2 className="text-base font-bold uppercase tracking-wide text-foreground">
                  Couldn&apos;t load interests
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onSkip} className="min-h-11 flex-1">
                Skip for now
              </Button>
              <Button type="button" onClick={loadTopics} className="min-h-11 flex-1">
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (noEligibleSports) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-background/75 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-end p-4 sm:justify-center">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-athletic">
          <div className="space-y-1 pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
              Personalize your feed
            </p>
            <h2
              className={cn(
                "font-['Barlow_Condensed',sans-serif] text-3xl font-bold uppercase leading-none tracking-tight",
                getGradientText("editorial")
              )}
            >
              {step === 1 ? "Pick your sports" : "Pick entities"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? "Choose at least one sport to improve your recommendations."
                : "Optional: add teams, athletes, and events you care about."}
            </p>
          </div>

          {step === 1 ? (
            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
              {sports.map((sport) => {
                const selected = selectedSports.some((item) => item.id === sport.id);
                return (
                  <button
                    key={sport.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedSports((current) =>
                        selected
                          ? current.filter((item) => item.id !== sport.id)
                          : [...current, sport]
                      );
                    }}
                    className={cn(
                      "flex min-h-11 items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    )}
                  >
                    <span className="font-semibold">{sport.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {selected ? "Selected" : "Tap"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search teams, athletes, tournaments"
                className="min-h-11"
              />

              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {entityOptions.length === 0 ? (
                  <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    No entities match your current sport selection.
                  </p>
                ) : (
                  entityOptions.map((entity) => {
                    const selected = selectedEntities.some((item) => item.id === entity.id);
                    return (
                      <button
                        key={entity.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedEntities((current) =>
                            selected
                              ? current.filter((item) => item.id !== entity.id)
                              : [...current, entity]
                          );
                        }}
                        className={cn(
                          "flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          selected
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/40"
                        )}
                      >
                        <span className="font-semibold">{entity.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {entity.schemaType.replace("SPORTS_", "")}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedEntities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntities.slice(0, 8).map((entity) => (
                    <Badge key={entity.id} variant="outline" className="border-primary/30">
                      {entity.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {saveError && (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {saveError}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onSkip} className="min-h-11 flex-1">
              Skip for now
            </Button>

            {step === 1 ? (
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={selectedSports.length === 0}
                className="min-h-11 flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={save} disabled={saving} className="min-h-11 flex-1">
                {saving ? "Saving..." : "Save preferences"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
