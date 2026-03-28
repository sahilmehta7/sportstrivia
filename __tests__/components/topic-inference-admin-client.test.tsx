import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TopicInferenceAdminClient } from "@/components/admin/TopicInferenceAdminClient";

const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("TopicInferenceAdminClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { taskId: "task_new" } }),
    }) as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renders latest runs, controls, and report download links", () => {
    render(
      <TopicInferenceAdminClient
        initialTasks={[
          {
            id: "audit_1",
            label: "Topic type audit",
            type: "TOPIC_TYPE_AUDIT",
            status: "COMPLETED",
            createdAt: new Date("2026-03-23T00:00:00Z").toISOString(),
            updatedAt: new Date("2026-03-23T00:02:00Z").toISOString(),
            input: { reportKind: "all" },
            result: {
              rows: {
                typed: [
                  {
                    topicId: "topic_1",
                    name: "Football",
                    slug: "football",
                    currentSchemaType: "SPORTS_TEAM",
                    ancestorPath: "Sports",
                    suggestedSchemaType: "SPORT",
                    confidence: 0.94,
                    rationale: "Category term, not a team.",
                  },
                ],
                untyped: [],
              },
            },
          },
          {
            id: "task_1",
            label: "Topic relation inference",
            type: "TOPIC_RELATION_INFERENCE",
            status: "COMPLETED",
            createdAt: new Date("2026-03-23T00:00:00Z").toISOString(),
            updatedAt: new Date("2026-03-23T00:01:00Z").toISOString(),
            input: { runMode: "dry_run" },
            result: {
              summary: { inferredCount: 4, anomalyCount: 1 },
              artifacts: {
                typedReport: { filename: "typed-topics-report.csv" },
                untypedReport: { filename: "untyped-topics-report.csv" },
              },
            },
          },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: /topic inference workflow/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ai type review/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run inference/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run ai type audit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/select football/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download typed report/i })).toHaveAttribute(
      "href",
      "/api/admin/topics/inference/runs/task_1/typed-report"
    );
    expect(screen.getByText(/inferred: 4/i)).toBeInTheDocument();
  });

  it("starts an inference run from the UI", async () => {
    render(<TopicInferenceAdminClient initialTasks={[]} />);

    fireEvent.change(screen.getByLabelText(/run mode/i), { target: { value: "apply_safe_relations" } });
    fireEvent.click(screen.getByRole("button", { name: /run inference/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/topics/inference/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runMode: "apply_safe_relations" }),
      });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("reruns a previous inference task", async () => {
    render(
      <TopicInferenceAdminClient
        initialTasks={[
          {
            id: "task_1",
            label: "Topic relation inference",
            type: "TOPIC_RELATION_INFERENCE",
            status: "FAILED",
            createdAt: new Date("2026-03-23T00:00:00Z").toISOString(),
            updatedAt: new Date("2026-03-23T00:01:00Z").toISOString(),
            input: { runMode: "dry_run" },
            result: null,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /rerun task task_1/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/topics/inference/runs/task_1/rerun", {
        method: "POST",
      });
    });
  });

  it("starts a separate AI topic type audit", async () => {
    render(<TopicInferenceAdminClient initialTasks={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /run ai type audit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/topics/inference/type-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportKind: "all" }),
      });
    });
  });

  it("applies selected AI topic type suggestions", async () => {
    render(
      <TopicInferenceAdminClient
        initialTasks={[
          {
            id: "audit_1",
            label: "Topic type audit",
            type: "TOPIC_TYPE_AUDIT",
            status: "COMPLETED",
            createdAt: new Date("2026-03-23T00:00:00Z").toISOString(),
            updatedAt: new Date("2026-03-23T00:01:00Z").toISOString(),
            input: { reportKind: "all" },
            result: {
              rows: {
                typed: [
                  {
                    topicId: "topic_1",
                    name: "Football",
                    slug: "football",
                    currentSchemaType: "SPORTS_TEAM",
                    ancestorPath: "Sports",
                    suggestedSchemaType: "SPORT",
                    confidence: 0.94,
                    rationale: "Category term, not a team.",
                  },
                ],
                untyped: [],
              },
            },
          },
        ]}
      />
    );

    fireEvent.click(screen.getByLabelText(/select football/i));
    fireEvent.click(screen.getByRole("button", { name: /apply selected \(1\)/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/topics/inference/type-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTaskId: "audit_1",
          selections: [{ topicId: "topic_1", targetSchemaType: "SPORT" }],
        }),
      });
    });
  });

  it("renders active task progress and task detail links", () => {
    render(
      <TopicInferenceAdminClient
        initialTasks={[
          {
            id: "task_2",
            label: "Topic type audit",
            type: "TOPIC_TYPE_AUDIT",
            status: "IN_PROGRESS",
            createdAt: new Date("2026-03-23T00:00:00Z").toISOString(),
            updatedAt: new Date("2026-03-23T00:01:00Z").toISOString(),
            input: { reportKind: "all" },
            result: {
              progress: { percentage: 0.42, status: "Auditing topic types (8/20)" },
            },
          },
        ]}
      />
    );

    expect(screen.getByText(/auditing topic types/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open task detail for task_2/i })).toHaveAttribute(
      "href",
      "/admin/ai-tasks/task_2"
    );
  });
});
