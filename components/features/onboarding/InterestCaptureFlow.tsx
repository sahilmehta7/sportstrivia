"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type TopicNode = {
  id: string;
  name: string;
  slug: string;
  schemaType: string;
  parentId: string | null;
  children?: TopicNode[];
};

type TopicHierarchyResponse = {
  data: {
    topics: TopicNode[];
  };
};

type InterestCaptureFlowProps = {
  onSkip: () => void;
  onComplete: () => void;
};

function collectNodes(root: TopicNode): TopicNode[] {
  const nodes = [root];
  for (const child of root.children ?? []) {
    nodes.push(...collectNodes(child));
  }
  return nodes;
}

export function InterestCaptureFlow({ onSkip, onComplete }: InterestCaptureFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [sports, setSports] = useState<TopicNode[]>([]);
  const [entities, setEntities] = useState<TopicNode[]>([]);
  const [selectedSports, setSelectedSports] = useState<TopicNode[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<TopicNode[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/topics?hierarchy=true");
        const payload = (await response.json()) as TopicHierarchyResponse;
        if (!response.ok) return;

        const rootNodes = payload.data.topics;
        const flat = rootNodes.flatMap((node) => collectNodes(node));
        setSports(flat.filter((topic) => topic.schemaType === "SPORT"));
        setEntities(
          flat.filter((topic) =>
            ["SPORTS_TEAM", "ATHLETE", "SPORTS_EVENT", "SPORTS_ORGANIZATION"].includes(
              topic.schemaType
            )
          )
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selectedSportIds = useMemo(
    () => new Set(selectedSports.map((sport) => sport.id)),
    [selectedSports]
  );

  const entityOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return entities
      .filter((entity) => {
        if (selectedSportIds.size > 0 && entity.parentId) {
          return selectedSportIds.has(entity.parentId);
        }
        return true;
      })
      .filter((entity) => {
        if (!normalized) return true;
        return entity.name.toLowerCase().includes(normalized) || entity.slug.toLowerCase().includes(normalized);
      })
      .slice(0, 24);
  }, [entities, query, selectedSportIds]);

  const save = async () => {
    setSaving(true);
    try {
      const topicIds = [
        ...selectedSports.map((topic) => topic.id),
        ...selectedEntities.map((topic) => topic.id),
      ];

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

      if (!response.ok) {
        return;
      }

      onComplete();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-end p-4 sm:justify-center">
        <div className="rounded-3xl border border-white/15 bg-[#0b1220] p-5 shadow-2xl">
          <div className="space-y-1 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Personalize your feed</p>
            <h2 className="text-xl font-black tracking-tight text-white">
              {step === 1 ? "Pick your sports" : "Pick favorite entities"}
            </h2>
            <p className="text-sm text-slate-300">
              {step === 1
                ? "Choose at least one sport to improve your recommendations."
                : "Optional: add teams, athletes, or tournaments you care about."}
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
                    onClick={() => {
                      setSelectedSports((current) =>
                        selected
                          ? current.filter((item) => item.id !== sport.id)
                          : [...current, sport]
                      );
                    }}
                    className={`flex min-h-11 items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                      selected
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                        : "border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    <span className="font-semibold">{sport.name}</span>
                    <span className="text-[11px] uppercase tracking-wide">{selected ? "Selected" : "Tap"}</span>
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
                className="min-h-11 border-white/20 bg-white/10 text-white placeholder:text-slate-400"
              />
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {entityOptions.map((entity) => {
                  const selected = selectedEntities.some((item) => item.id === entity.id);
                  return (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => {
                        setSelectedEntities((current) =>
                          selected
                            ? current.filter((item) => item.id !== entity.id)
                            : [...current, entity]
                        );
                      }}
                      className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                        selected
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                          : "border-white/10 bg-white/5 text-slate-200"
                      }`}
                    >
                      <span className="font-semibold">{entity.name}</span>
                      <span className="text-[11px] uppercase tracking-wide">{entity.schemaType.replace("SPORTS_", "")}</span>
                    </button>
                  );
                })}
              </div>

              {selectedEntities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntities.slice(0, 8).map((entity) => (
                    <Badge key={entity.id} variant="outline" className="border-cyan-500/40 text-cyan-200">
                      {entity.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="min-h-11 flex-1 border-white/30 bg-transparent text-slate-200 hover:bg-white/10"
            >
              Skip for now
            </Button>

            {step === 1 ? (
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={selectedSports.length === 0}
                className="min-h-11 flex-1 bg-cyan-500 text-black hover:bg-cyan-400"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={save}
                disabled={saving}
                className="min-h-11 flex-1 bg-cyan-500 text-black hover:bg-cyan-400"
              >
                {saving ? "Saving..." : "Save preferences"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
