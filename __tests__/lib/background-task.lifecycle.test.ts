jest.mock("@/lib/db", () => {
  const state: any = {
    id: "task_1",
    userId: "admin_1",
    type: "AI_QUIZ_GENERATION",
    status: "IN_PROGRESS",
    attempt: 1,
    cancelledAttempt: null,
    cancelledAt: null,
    result: null,
    errorMessage: null,
    startedAt: null,
    completedAt: null,
  };

  const updateMany = jest.fn(async ({ where, data }: any) => {
    if (where.id && where.id !== state.id) return { count: 0 };
    if (where.attempt !== undefined && where.attempt !== state.attempt) return { count: 0 };
    if (where.status?.in && !where.status.in.includes(state.status)) return { count: 0 };
    if (where.OR && where.attempt !== undefined) {
      const allow = where.OR.some((rule: any) => {
        if (rule.cancelledAttempt === null) return state.cancelledAttempt === null;
        if (rule.cancelledAttempt?.not !== undefined) return state.cancelledAttempt !== rule.cancelledAttempt.not;
        return false;
      });
      if (!allow) return { count: 0 };
    }
    Object.assign(state, data);
    return { count: 1 };
  });

  const update = jest.fn(async ({ where, data }: any) => {
    if (where.id && where.id !== state.id) {
      throw new Error("Task not found");
    }

    const nextData = { ...data };
    if (data?.attempt?.increment) {
      nextData.attempt = state.attempt + data.attempt.increment;
    }

    Object.assign(state, nextData);
    return { ...state };
  });

  return {
    prisma: {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ value: "AI_QUIZ_GENERATION" }]),
      adminBackgroundTask: {
        create: jest.fn(),
        update,
        updateMany,
        findUnique: jest.fn(async () => ({ ...state })),
        findMany: jest.fn(),
      },
    },
  };
});

import { cancelBackgroundTask, markBackgroundTaskCompleted, restartBackgroundTask } from "@/lib/services/background-task.service";

describe("background task lifecycle guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks terminal completion write after cancelling same attempt", async () => {
    const cancelled = await cancelBackgroundTask("task_1", 1);
    expect(cancelled?.status).toBe("CANCELLED");

    const completion = await markBackgroundTaskCompleted("task_1", { ok: true }, 1);
    expect(completion).toBeNull();
  });

  it("allows new attempt after retry restart", async () => {
    await cancelBackgroundTask("task_1", 1);
    const restarted = await restartBackgroundTask("task_1");
    expect((restarted as any).attempt).toBe(2);
    expect(restarted.status).toBe("PENDING");
  });
});
