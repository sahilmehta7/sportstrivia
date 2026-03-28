"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TOPIC_SCHEMA_TYPES, TOPIC_SCHEMA_TYPE_LABELS, type TopicSchemaTypeValue } from "@/lib/topic-schema-options";

type TopicInferenceTaskView = {
  id: string;
  label: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  input?: Record<string, unknown> | null;
  result?: Record<string, any> | null;
};

type AuditRow = {
  topicId: string;
  name: string;
  slug: string;
  currentSchemaType: TopicSchemaTypeValue;
  ancestorPath: string;
  suggestedSchemaType: TopicSchemaTypeValue | null;
  confidence: number | null;
  rationale: string;
};

function formatTaskType(type: string) {
  switch (type) {
    case "TOPIC_RELATION_INFERENCE":
      return "Relation Inference";
    case "TOPIC_TYPE_AUDIT":
      return "AI Type Audit";
    default:
      return type.replace(/_/g, " ");
  }
}

export function TopicInferenceAdminClient({
  initialTasks,
  latestAuditTask: latestAuditTaskFromServer,
}: {
  initialTasks: TopicInferenceTaskView[];
  latestAuditTask?: TopicInferenceTaskView | null;
}) {
  const router = useRouter();
  const [runMode, setRunMode] = useState<"dry_run" | "apply_safe_relations">("dry_run");
  const [running, setRunning] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [rerunningTaskId, setRerunningTaskId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<string, TopicSchemaTypeValue>>({});

  const tasks = initialTasks;
  const latestAuditTaskFromList = [...tasks]
    .filter((task) => task.type === "TOPIC_TYPE_AUDIT" && task.result?.rows)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  const latestAuditTask = latestAuditTaskFromServer ?? latestAuditTaskFromList;
  const latestAuditRows: AuditRow[] = latestAuditTask
    ? ([...(latestAuditTask.result?.rows?.typed ?? []), ...(latestAuditTask.result?.rows?.untyped ?? [])] as AuditRow[])
        .filter((row) => row.suggestedSchemaType)
    : [];
  const selectedCount = Object.keys(selectedRows).length;

  const handleRunInference = async () => {
    setRunning(true);
    try {
      await fetch("/api/admin/topics/inference/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runMode }),
      });
      router.refresh();
    } finally {
      setRunning(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      await fetch("/api/admin/topics/inference/type-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportKind: "all" }),
      });
      router.refresh();
    } finally {
      setAuditing(false);
    }
  };

  const handleRerun = async (taskId: string) => {
    setRerunningTaskId(taskId);
    try {
      await fetch(`/api/admin/topics/inference/runs/${taskId}/rerun`, {
        method: "POST",
      });
      router.refresh();
    } finally {
      setRerunningTaskId(null);
    }
  };

  const toggleSelection = (row: AuditRow, checked: boolean) => {
    setSelectedRows((current) => {
      const next = { ...current };
      if (!checked || !row.suggestedSchemaType) {
        delete next[row.topicId];
        return next;
      }
      next[row.topicId] = row.suggestedSchemaType;
      return next;
    });
  };

  const updateSelectionTarget = (topicId: string, targetSchemaType: TopicSchemaTypeValue) => {
    setSelectedRows((current) => ({
      ...current,
      [topicId]: targetSchemaType,
    }));
  };

  const handleApplySelected = async () => {
    if (!latestAuditTask || selectedCount === 0) return;
    setApplying(true);
    try {
      await fetch("/api/admin/topics/inference/type-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTaskId: latestAuditTask.id,
          selections: Object.entries(selectedRows).map(([topicId, targetSchemaType]) => ({
            topicId,
            targetSchemaType,
          })),
        }),
      });
      setSelectedRows({});
      router.refresh();
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl sm:text-2xl font-semibold leading-none tracking-tight">Topic Inference Workflow</h2>
          <CardDescription>
            Run deterministic relation inference, download typed and untyped audit reports, and launch review-only AI type audits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="run-mode">Run mode</Label>
            <select
              id="run-mode"
              aria-label="Run mode"
              value={runMode}
              onChange={(event) => setRunMode(event.target.value as "dry_run" | "apply_safe_relations")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="dry_run">dry_run</option>
              <option value="apply_safe_relations">apply_safe_relations</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleRunInference} disabled={running}>
              {running ? "Running..." : "Run inference"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleRunAudit} disabled={auditing}>
              {auditing ? "Running AI audit..." : "Run AI type audit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {latestAuditTask ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl sm:text-2xl font-semibold leading-none tracking-tight">AI Type Review</h2>
            <CardDescription>
              Review the latest AI topic-type suggestions and apply only the rows you explicitly select.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestAuditRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">The latest AI audit has no actionable suggestions yet.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={handleApplySelected} disabled={applying || selectedCount === 0}>
                    {applying ? "Applying..." : `Apply selected (${selectedCount})`}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Source audit: {latestAuditTask.label}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/60 text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-3 py-2 font-semibold">Apply</th>
                        <th className="px-3 py-2 font-semibold">Topic</th>
                        <th className="px-3 py-2 font-semibold">Current</th>
                        <th className="px-3 py-2 font-semibold">Suggested</th>
                        <th className="px-3 py-2 font-semibold">Target</th>
                        <th className="px-3 py-2 font-semibold">Confidence</th>
                        <th className="px-3 py-2 font-semibold">Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {latestAuditRows.map((row) => {
                        const checked = row.topicId in selectedRows;
                        const targetValue = selectedRows[row.topicId] ?? row.suggestedSchemaType ?? "NONE";
                        return (
                          <tr key={row.topicId}>
                            <td className="px-3 py-2 align-top">
                              <input
                                type="checkbox"
                                aria-label={`Select ${row.name}`}
                                checked={checked}
                                onChange={(event) => toggleSelection(row, event.target.checked)}
                              />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="font-medium">{row.name}</div>
                              <div className="text-xs text-muted-foreground">{row.slug}</div>
                            </td>
                            <td className="px-3 py-2 align-top">{TOPIC_SCHEMA_TYPE_LABELS[row.currentSchemaType]}</td>
                            <td className="px-3 py-2 align-top">
                              {row.suggestedSchemaType ? TOPIC_SCHEMA_TYPE_LABELS[row.suggestedSchemaType] : "None"}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <select
                                aria-label={`Target type for ${row.name}`}
                                value={targetValue}
                                disabled={!checked}
                                onChange={(event) =>
                                  updateSelectionTarget(row.topicId, event.target.value as TopicSchemaTypeValue)
                                }
                                className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                              >
                                {TOPIC_SCHEMA_TYPES.filter((type) => type !== "NONE").map((type) => (
                                  <option key={type} value={type}>
                                    {TOPIC_SCHEMA_TYPE_LABELS[type]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 align-top">
                              {typeof row.confidence === "number" ? row.confidence.toFixed(2) : "n/a"}
                            </td>
                            <td className="px-3 py-2 align-top text-muted-foreground">{row.rationale}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No inference or audit runs yet.
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => {
            const summary = task.result?.summary;
            const progress = task.result?.progress;
            const typedHref = `/api/admin/topics/inference/runs/${task.id}/typed-report`;
            const untypedHref = `/api/admin/topics/inference/runs/${task.id}/untyped-report`;

            return (
              <Card key={task.id}>
                <CardHeader>
                  <h3 className="text-lg font-semibold leading-none tracking-tight">{task.label}</h3>
                  <CardDescription>
                    {formatTaskType(task.type)} • {task.status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {summary ? (
                    <div className="flex flex-wrap gap-4 text-muted-foreground">
                      {typeof summary.inferredCount === "number" && <span>Inferred: {summary.inferredCount}</span>}
                      {typeof summary.anomalyCount === "number" && <span>Anomalies: {summary.anomalyCount}</span>}
                      {typeof summary.appliedCount === "number" && <span>Applied: {summary.appliedCount}</span>}
                    </div>
                  ) : null}

                  {progress?.status ? (
                    <div className="text-muted-foreground">{progress.status}</div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/ai-tasks/${task.id}`} aria-label={`Open task detail for ${task.id}`}>
                      <Button type="button" variant="outline" size="sm">Task detail</Button>
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRerun(task.id)}
                      disabled={rerunningTaskId === task.id}
                      aria-label={`Rerun task ${task.id}`}
                    >
                      {rerunningTaskId === task.id ? "Rerunning..." : "Rerun"}
                    </Button>
                    {task.result?.artifacts?.typedReport ? (
                      <Link href={typedHref} aria-label="Download typed report">
                        <Button type="button" variant="outline" size="sm">Download typed report</Button>
                      </Link>
                    ) : null}
                    {task.result?.artifacts?.untypedReport ? (
                      <Link href={untypedHref} aria-label="Download untyped report">
                        <Button type="button" variant="outline" size="sm">Download untyped report</Button>
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
