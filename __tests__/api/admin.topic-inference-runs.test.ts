/** @jest-environment node */

var prismaMock: {
  adminBackgroundTask: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  $queryRawUnsafe: jest.Mock;
};

jest.mock("next/server", () => ({
  after: jest.fn((callback: () => void) => callback()),
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      json: async () => body,
      text: async () => typeof body === "string" ? body : JSON.stringify(body),
      ...init,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/db", () => {
  prismaMock = {
    adminBackgroundTask: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $queryRawUnsafe: jest.fn().mockResolvedValue([
      { value: "AI_QUIZ_GENERATION" },
      { value: "AI_TOPIC_QUESTION_GENERATION" },
      { value: "AI_QUIZ_IMPORT" },
      { value: "AI_TOPIC_QUESTION_IMPORT" },
      { value: "BACKUP_CREATE" },
      { value: "BACKUP_RESTORE" },
      { value: "TOPIC_RELATION_INFERENCE" },
      { value: "TOPIC_TYPE_AUDIT" },
      { value: "TOPIC_TYPE_APPLY" },
    ]),
  };

  return { prisma: prismaMock };
});

jest.mock("@/lib/services/topic-inference-task.service", () => ({
  processTopicInferenceTask: jest.fn().mockResolvedValue(undefined),
  processTopicTypeAuditTask: jest.fn().mockResolvedValue(undefined),
  processTopicTypeApplyTask: jest.fn().mockResolvedValue(undefined),
  validateTopicTypeApplySelections: jest.fn().mockResolvedValue({
    sourceTaskId: "task_ai_1",
    allowedSelectionKeys: new Set(["topic_1:SPORTS_TEAM"]),
  }),
}));

import { requireAdmin } from "@/lib/auth-helpers";
import { BackgroundTaskType } from "@prisma/client";
import { POST as startInferenceRun } from "@/app/api/admin/topics/inference/runs/route";
import { POST as rerunInferenceRun } from "@/app/api/admin/topics/inference/runs/[id]/rerun/route";
import { GET as downloadTypedReport } from "@/app/api/admin/topics/inference/runs/[id]/typed-report/route";
import { GET as downloadUntypedReport } from "@/app/api/admin/topics/inference/runs/[id]/untyped-report/route";
import { POST as startTypeAuditRun } from "@/app/api/admin/topics/inference/type-audit/route";
import { POST as startTypeApplyRun } from "@/app/api/admin/topics/inference/type-apply/route";
import { GET as getTaskDetail } from "@/app/api/admin/ai/tasks/[id]/route";
import {
  processTopicInferenceTask,
  processTopicTypeApplyTask,
  processTopicTypeAuditTask,
  validateTopicTypeApplySelections,
} from "@/lib/services/topic-inference-task.service";

describe("topic inference task routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    (validateTopicTypeApplySelections as jest.Mock).mockResolvedValue({
      sourceTaskId: "task_ai_1",
      allowedSelectionKeys: new Set(["topic_1:SPORTS_TEAM"]),
    });
    prismaMock.adminBackgroundTask.create.mockResolvedValue({
      id: "task_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      status: "PENDING",
      label: "Topic relation inference",
      input: { runMode: "dry_run" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("starts a relation inference run and returns a task id", async () => {
    const request = new Request("http://localhost/api/admin/topics/inference/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runMode: "dry_run" }),
    });

    const response = await startInferenceRun(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.taskId).toBe("task_1");
    expect(prismaMock.adminBackgroundTask.create).toHaveBeenCalled();
  });

  it("returns success even if relation inference processor throws in after callback", async () => {
    (processTopicInferenceTask as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const request = new Request("http://localhost/api/admin/topics/inference/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runMode: "dry_run" }),
    });

    const response = await startInferenceRun(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("processing");
  });

  it("starts an AI topic type audit run and returns a task id", async () => {
    prismaMock.adminBackgroundTask.create.mockResolvedValue({
      id: "task_ai_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      status: "PENDING",
      label: "Topic type audit",
      input: { reportKind: "all" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request("http://localhost/api/admin/topics/inference/type-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportKind: "all" }),
    });

    const response = await startTypeAuditRun(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.taskId).toBe("task_ai_1");
  });

  it("returns success even if type-audit processor throws in after callback", async () => {
    (processTopicTypeAuditTask as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    prismaMock.adminBackgroundTask.create.mockResolvedValue({
      id: "task_ai_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      status: "PENDING",
      label: "Topic type audit",
      input: { reportKind: "all" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request("http://localhost/api/admin/topics/inference/type-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportKind: "all" }),
    });

    const response = await startTypeAuditRun(request as any);

    expect(response.status).toBe(200);
  });

  it("starts an AI topic type apply run and returns a task id", async () => {
    prismaMock.adminBackgroundTask.create.mockResolvedValue({
      id: "task_apply_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_TYPE_APPLY,
      status: "PENDING",
      label: "Topic type apply",
      input: {
        sourceTaskId: "task_ai_1",
        selections: [{ topicId: "topic_1", targetSchemaType: "SPORTS_TEAM" }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request("http://localhost/api/admin/topics/inference/type-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceTaskId: "task_ai_1",
        selections: [{ topicId: "topic_1", targetSchemaType: "SPORTS_TEAM" }],
      }),
    });

    const response = await startTypeApplyRun(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.taskId).toBe("task_apply_1");
    expect(validateTopicTypeApplySelections).toHaveBeenCalledWith({
      sourceTaskId: "task_ai_1",
      selections: [{ topicId: "topic_1", targetSchemaType: "SPORTS_TEAM" }],
      requestingUserId: "admin_1",
    });
  });

  it("returns success even if type-apply processor throws in after callback", async () => {
    (processTopicTypeApplyTask as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    prismaMock.adminBackgroundTask.create.mockResolvedValue({
      id: "task_apply_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_TYPE_APPLY,
      status: "PENDING",
      label: "Topic type apply",
      input: {
        sourceTaskId: "task_ai_1",
        selections: [{ topicId: "topic_1", targetSchemaType: "SPORTS_TEAM" }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request("http://localhost/api/admin/topics/inference/type-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceTaskId: "task_ai_1",
        selections: [{ topicId: "topic_1", targetSchemaType: "SPORTS_TEAM" }],
      }),
    });

    const response = await startTypeApplyRun(request as any);

    expect(response.status).toBe(200);
  });

  it("reruns a prior relation inference task with the same input", async () => {
    prismaMock.adminBackgroundTask.findUnique.mockResolvedValueOnce({
      id: "task_old",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      label: "Topic relation inference",
      input: { runMode: "apply_safe_relations" },
    });
    prismaMock.adminBackgroundTask.create.mockResolvedValueOnce({
      id: "task_new",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      status: "PENDING",
      label: "Topic relation inference",
      input: { runMode: "apply_safe_relations" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await rerunInferenceRun(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_old" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.taskId).toBe("task_new");
    expect(prismaMock.adminBackgroundTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          input: { runMode: "apply_safe_relations" },
        }),
      })
    );
  });

  it("returns success even if rerun processor throws in after callback", async () => {
    (processTopicInferenceTask as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    prismaMock.adminBackgroundTask.findUnique.mockResolvedValueOnce({
      id: "task_old",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      label: "Topic relation inference",
      input: { runMode: "apply_safe_relations" },
    });
    prismaMock.adminBackgroundTask.create.mockResolvedValueOnce({
      id: "task_new",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      status: "PENDING",
      label: "Topic relation inference",
      input: { runMode: "apply_safe_relations" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await rerunInferenceRun(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_old" }),
    });

    expect(response.status).toBe(200);
  });

  it("serves the typed report download for a completed run", async () => {
    prismaMock.adminBackgroundTask.findUnique.mockResolvedValue({
      id: "task_1",
      userId: "admin_1",
      result: {
        artifacts: {
          typedReport: {
            filename: "typed-topics-report.csv",
            contentType: "text/csv; charset=utf-8",
            content: "topicId,name\nteam_1,Mumbai Indians",
          },
        },
      },
    });

    const response = await downloadTypedReport(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(await response.text()).toContain("Mumbai Indians");
  });

  it("serves the untyped report download for a completed run", async () => {
    prismaMock.adminBackgroundTask.findUnique.mockResolvedValue({
      id: "task_1",
      userId: "admin_1",
      result: {
        artifacts: {
          untypedReport: {
            filename: "untyped-topics-report.csv",
            contentType: "text/csv; charset=utf-8",
            content: "topicId,name\nbucket_1,IPL Teams",
          },
        },
      },
    });

    const response = await downloadUntypedReport(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("IPL Teams");
  });

  it("exposes task detail including artifact metadata", async () => {
    prismaMock.adminBackgroundTask.findUnique.mockResolvedValue({
      id: "task_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      status: "COMPLETED",
      label: "Topic relation inference",
      input: { runMode: "dry_run" },
      result: {
        summary: { appliedCount: 1 },
        artifacts: {
          typedReport: { filename: "typed-topics-report.csv" },
        },
      },
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await getTaskDetail({} as any, {
      params: Promise.resolve({ id: "task_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.task.result.artifacts.typedReport.filename).toBe("typed-topics-report.csv");
  });
});
