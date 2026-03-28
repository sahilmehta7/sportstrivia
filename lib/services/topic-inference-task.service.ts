import { BackgroundTaskStatus, BackgroundTaskType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getCurrentTaskExecutionContext,
  getBackgroundTaskById,
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  markBackgroundTaskInProgress,
  shouldStopTaskExecution,
  updateTaskProgress,
} from "@/lib/services/background-task.service";
import {
  analyzeTopicHierarchy,
  buildTypedTopicReportRows,
  buildUntypedTopicReportRows,
  type TopicHierarchyNode,
} from "@/lib/topic-graph/topic-inference.service";
import { applyInferredSportRelations } from "@/lib/topic-graph/topic-inference-apply.service";
import {
  buildInferenceCsvArtifact,
  buildTopicTypeAuditCsvArtifact,
} from "@/lib/topic-graph/topic-inference-report.service";
import {
  buildTopicTypeAuditPromptInput,
  normalizeTopicTypeAuditResult,
} from "@/lib/topic-graph/topic-type-audit.service";
import { syncTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { callOpenAIWithRetry, extractContentFromCompletion } from "@/lib/services/ai-openai-client.service";
import { getAIModel } from "@/lib/services/settings.service";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getBudgetPolicyForTaskType } from "@/lib/services/ai-budget-policy.service";

export type TopicInferenceRunMode = "dry_run" | "apply_safe_relations";
export type TopicTypeAuditRow = {
  topicId: string;
  name: string;
  slug: string;
  currentSchemaType: TopicSchemaTypeValue;
  ancestorPath: string;
  suggestedSchemaType: TopicSchemaTypeValue | null;
  confidence: number | null;
  rationale: string;
};

export type TopicTypeApplySelection = {
  topicId: string;
  targetSchemaType: TopicSchemaTypeValue;
};

type TopicTypeApplyValidationResult = {
  sourceTaskId: string;
  allowedSelectionKeys: Set<string>;
};

function buildSelectionKey(topicId: string, targetSchemaType: TopicSchemaTypeValue) {
  return `${topicId}:${targetSchemaType}`;
}

function extractAuditSuggestionRows(taskResult: unknown): TopicTypeAuditRow[] {
  const rows = taskResult && typeof taskResult === "object" ? (taskResult as any).rows : null;
  const typed = Array.isArray(rows?.typed) ? rows.typed : [];
  const untyped = Array.isArray(rows?.untyped) ? rows.untyped : [];
  return [...typed, ...untyped] as TopicTypeAuditRow[];
}

export async function validateTopicTypeApplySelections(input: {
  sourceTaskId?: string;
  selections?: TopicTypeApplySelection[];
  requestingUserId?: string | null;
}): Promise<TopicTypeApplyValidationResult> {
  const sourceTaskId = input.sourceTaskId?.trim();
  if (!sourceTaskId) {
    throw new BadRequestError("sourceTaskId is required");
  }

  const selections = Array.isArray(input.selections) ? input.selections : [];
  if (selections.length === 0) {
    throw new BadRequestError("At least one selected topic type change is required");
  }

  const sourceTask = await getBackgroundTaskById(sourceTaskId);
  if (!sourceTask) {
    throw new NotFoundError("Source audit task not found");
  }

  if (input.requestingUserId && sourceTask.userId && sourceTask.userId !== input.requestingUserId) {
    throw new ForbiddenError("You do not have access to the source audit task");
  }

  if (sourceTask.type !== BackgroundTaskType.TOPIC_TYPE_AUDIT) {
    throw new BadRequestError("sourceTaskId must reference a topic type audit task");
  }

  if (sourceTask.status !== BackgroundTaskStatus.COMPLETED) {
    throw new BadRequestError("sourceTaskId must reference a completed topic type audit task");
  }

  const suggestionRows = extractAuditSuggestionRows(sourceTask.result);
  const allowedSelectionKeys = new Set<string>();
  for (const row of suggestionRows) {
    if (row?.suggestedSchemaType) {
      allowedSelectionKeys.add(buildSelectionKey(row.topicId, row.suggestedSchemaType));
    }
  }

  for (const selection of selections) {
    const key = buildSelectionKey(selection.topicId, selection.targetSchemaType);
    if (!allowedSelectionKeys.has(key)) {
      throw new BadRequestError(
        `Selection (${selection.topicId} -> ${selection.targetSchemaType}) is not present in source audit suggestions`
      );
    }
  }

  return { sourceTaskId, allowedSelectionKeys };
}

async function loadTopicHierarchy(): Promise<TopicHierarchyNode[]> {
  const topics = await prisma.topic.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      schemaType: true,
      parentId: true,
      level: true,
      alternateNames: true,
      description: true,
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });

  return topics;
}

function summarizeInferenceResult(result: {
  typedRows: ReturnType<typeof buildTypedTopicReportRows>;
  untypedRows: ReturnType<typeof buildUntypedTopicReportRows>;
  inferredCount: number;
  skippedCount: number;
  anomalyCount: number;
  appliedCount: number;
}) {
  const typedReport = buildInferenceCsvArtifact("typed", result.typedRows);
  const untypedReport = buildInferenceCsvArtifact("untyped", result.untypedRows);

  return {
    summary: {
      inferredCount: result.inferredCount,
      skippedCount: result.skippedCount,
      anomalyCount: result.anomalyCount,
      appliedCount: result.appliedCount,
      typedTopicCount: result.typedRows.length,
      untypedTopicCount: result.untypedRows.length,
    },
    artifacts: {
      typedReport,
      untypedReport,
    },
  };
}

export async function processTopicInferenceTask(taskId: string): Promise<void> {
  const execution = await getCurrentTaskExecutionContext(taskId);
  const attempt = execution?.attempt;
  if (!attempt) return;

  try {
    const started = await markBackgroundTaskInProgress(taskId, attempt);
    if (!started) return;
    await updateTaskProgress(taskId, { percentage: 0.1, status: "Loading topic hierarchy..." }, attempt);

    const task = await getBackgroundTaskById(taskId);
    if (!task || !task.input) {
      throw new Error("Task not found or missing input");
    }
    if (task.type !== BackgroundTaskType.TOPIC_RELATION_INFERENCE) {
      throw new Error("Task is not a topic inference task");
    }

    const input = task.input as { runMode?: TopicInferenceRunMode };
    const runMode = input.runMode ?? "dry_run";
    const topics = await loadTopicHierarchy();

    if (await shouldStopTaskExecution(taskId, attempt)) return;
    await updateTaskProgress(taskId, { percentage: 0.45, status: "Analyzing hierarchy..." }, attempt);
    const analysis = analyzeTopicHierarchy(topics);
    const typedRows = buildTypedTopicReportRows(analysis);
    const untypedRows = buildUntypedTopicReportRows(analysis);

    let appliedCount = 0;
    if (runMode === "apply_safe_relations") {
      if (await shouldStopTaskExecution(taskId, attempt)) return;
      await updateTaskProgress(taskId, { percentage: 0.75, status: "Applying safe relations..." }, attempt);
      const applied = await applyInferredSportRelations({
        inferredRelations: analysis.inferredRelations,
        anomalyTopicIds: analysis.anomalyTopics.map((item) => item.topicId),
      });
      appliedCount = applied.appliedCount;
    }

    await markBackgroundTaskCompleted(
      taskId,
      summarizeInferenceResult({
        typedRows,
        untypedRows,
        inferredCount: analysis.inferredRelations.length,
        skippedCount: analysis.skippedTopics.length,
        anomalyCount: analysis.anomalyTopics.length,
        appliedCount,
      }),
      attempt
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (!(await shouldStopTaskExecution(taskId, attempt))) {
      await markBackgroundTaskFailed(taskId, message, undefined, attempt);
    }
    throw error;
  }
}

async function classifyTopicWithAI(
  promptInput: ReturnType<typeof buildTopicTypeAuditPromptInput>,
  options?: { cancellationCheck?: () => Promise<boolean> }
) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      suggestedSchemaType: promptInput.currentSchemaType === "NONE" ? "SPORTS_EVENT" : promptInput.currentSchemaType,
      confidence: 0.25,
      rationale: "OpenAI API key not configured; fallback heuristic suggestion only.",
    };
  }

  const aiModel = await getAIModel();
  const prompt = [
    "Classify the sports topic into exactly one schema type.",
    `Topic: ${promptInput.topicName}`,
    `Slug: ${promptInput.topicSlug}`,
    `Current schema type: ${promptInput.currentSchemaType}`,
    `Ancestor path: ${promptInput.ancestorPath}`,
    `Children: ${promptInput.childSummaries.join(", ") || "none"}`,
    `Nearest sport ancestor: ${promptInput.nearestSportAncestorName || "none"}`,
    'Return strict JSON with keys: suggestedSchemaType, confidence, rationale.',
  ].join("\n");

  const completion = await callOpenAIWithRetry(
    aiModel,
    prompt,
    "You classify sports taxonomy topics. Output only JSON.",
    {
      temperature: 0.1,
      maxTokens: 400,
      responseFormat: aiModel.startsWith("o1") ? null : { type: "json_object" },
      cancellationCheck: options?.cancellationCheck,
      budgetPolicy: getBudgetPolicyForTaskType(BackgroundTaskType.TOPIC_TYPE_AUDIT),
    }
  );
  const content = extractContentFromCompletion(completion, aiModel);
  const parsed = JSON.parse(content);
  return normalizeTopicTypeAuditResult(parsed);
}

export async function processTopicTypeAuditTask(taskId: string): Promise<void> {
  const execution = await getCurrentTaskExecutionContext(taskId);
  const attempt = execution?.attempt;
  if (!attempt) return;

  try {
    const started = await markBackgroundTaskInProgress(taskId, attempt);
    if (!started) return;
    await updateTaskProgress(taskId, { percentage: 0.1, status: "Loading topics for type audit..." }, attempt);

    const task = await getBackgroundTaskById(taskId);
    if (!task) throw new Error("Task not found");
    if (task.type !== BackgroundTaskType.TOPIC_TYPE_AUDIT) {
      throw new Error("Task is not a topic type audit task");
    }

    const topics = await prisma.topic.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        schemaType: true,
        description: true,
        alternateNames: true,
        parentId: true,
        children: {
          select: {
            name: true,
            schemaType: true,
          },
          orderBy: { name: "asc" },
        },
        parent: {
          select: {
            id: true,
            name: true,
            schemaType: true,
            parentId: true,
          },
        },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    const byId = new Map(topics.map((topic) => [topic.id, topic]));
    const typedRows: TopicTypeAuditRow[] = [];
    const untypedRows: TopicTypeAuditRow[] = [];

    for (let index = 0; index < topics.length; index += 1) {
      const topic = topics[index];
      let cursor = topic.parentId ? byId.get(topic.parentId) ?? null : null;
      const ancestors: Array<{ name: string; schemaType: typeof topic.schemaType }> = [];
      while (cursor) {
        ancestors.unshift({ name: cursor.name, schemaType: cursor.schemaType });
        cursor = cursor.parentId ? byId.get(cursor.parentId) ?? null : null;
      }

      const promptInput = buildTopicTypeAuditPromptInput({
        topic,
        ancestors,
        children: topic.children,
        inferenceHints: {
          nearestSportAncestorName: ancestors.find((ancestor) => ancestor.schemaType === "SPORT")?.name,
        },
      });

      let normalized: { suggestedSchemaType: TopicSchemaTypeValue | null; confidence: number | null; rationale: string };
      try {
        if (await shouldStopTaskExecution(taskId, attempt)) return;
        normalized = await classifyTopicWithAI(promptInput, {
          cancellationCheck: async () => shouldStopTaskExecution(taskId, attempt),
        });
      } catch (classificationError) {
        const message =
          classificationError instanceof Error ? classificationError.message : "Unknown AI classification error";
        normalized = {
          suggestedSchemaType: null,
          confidence: null,
          rationale: `Classification failed: ${message}`,
        };
      }
      const row = {
        topicId: topic.id,
        name: topic.name,
        slug: topic.slug,
        currentSchemaType: topic.schemaType,
        ancestorPath: promptInput.ancestorPath,
        suggestedSchemaType: normalized.suggestedSchemaType,
        confidence: normalized.confidence,
        rationale: normalized.rationale,
      };

      if (topic.schemaType === "NONE") {
        untypedRows.push(row);
      } else {
        typedRows.push(row);
      }

      await updateTaskProgress(taskId, {
        percentage: 0.1 + ((index + 1) / Math.max(topics.length, 1)) * 0.8,
        status: `Auditing topic types (${index + 1}/${topics.length})`,
      }, attempt);
    }

    await markBackgroundTaskCompleted(taskId, {
      summary: {
        typedTopicCount: typedRows.length,
        untypedTopicCount: untypedRows.length,
      },
      rows: {
        typed: typedRows,
        untyped: untypedRows,
      },
      artifacts: {
        typedReport: buildTopicTypeAuditCsvArtifact("typed", typedRows as any),
        untypedReport: buildTopicTypeAuditCsvArtifact("untyped", untypedRows as any),
      },
    }, attempt);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (!(await shouldStopTaskExecution(taskId, attempt))) {
      await markBackgroundTaskFailed(taskId, message, undefined, attempt);
    }
    throw error;
  }
}

export async function processTopicTypeApplyTask(taskId: string): Promise<void> {
  const execution = await getCurrentTaskExecutionContext(taskId);
  const attempt = execution?.attempt;
  if (!attempt) return;

  try {
    const started = await markBackgroundTaskInProgress(taskId, attempt);
    if (!started) return;
    await updateTaskProgress(taskId, { percentage: 0.1, status: "Loading selected topic type changes..." }, attempt);

    const task = await getBackgroundTaskById(taskId);
    if (!task || !task.input) {
      throw new Error("Task not found or missing input");
    }
    if (task.type !== BackgroundTaskType.TOPIC_TYPE_APPLY) {
      throw new Error("Task is not a topic type apply task");
    }

    const input = task.input as {
      sourceTaskId?: string;
      selections?: TopicTypeApplySelection[];
    };
    const selections = Array.isArray(input.selections) ? input.selections : [];
    await validateTopicTypeApplySelections({
      sourceTaskId: input.sourceTaskId,
      selections,
      requestingUserId: task.userId,
    });

    const appliedRows: Array<{
      topicId: string;
      previousSchemaType: TopicSchemaTypeValue;
      targetSchemaType: TopicSchemaTypeValue;
    }> = [];
    let skippedCount = 0;

    for (let index = 0; index < selections.length; index += 1) {
      const selection = selections[index];
      const topic = await prisma.topic.findUnique({
        where: { id: selection.topicId },
        select: { id: true, schemaType: true },
      });

      if (!topic) {
        skippedCount += 1;
        continue;
      }

      if (topic.schemaType === selection.targetSchemaType) {
        skippedCount += 1;
        continue;
      }

      await prisma.topic.update({
        where: { id: topic.id },
        data: { schemaType: selection.targetSchemaType },
      });
      await syncTopicEntityReadiness(topic.id);

      appliedRows.push({
        topicId: topic.id,
        previousSchemaType: topic.schemaType,
        targetSchemaType: selection.targetSchemaType,
      });

      await updateTaskProgress(taskId, {
        percentage: 0.1 + ((index + 1) / selections.length) * 0.8,
        status: `Applying topic types (${index + 1}/${selections.length})`,
      }, attempt);
    }

    await markBackgroundTaskCompleted(taskId, {
      summary: {
        sourceTaskId: input.sourceTaskId ?? null,
        selectedCount: selections.length,
        appliedCount: appliedRows.length,
        skippedCount,
      },
      appliedRows,
    }, attempt);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (!(await shouldStopTaskExecution(taskId, attempt))) {
      await markBackgroundTaskFailed(taskId, message, undefined, attempt);
    }
    throw error;
  }
}
