import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { prisma } from "@/lib/db";

type AggregateRow = {
  calls: number;
  tokens: number;
  costUsd: number;
  retries: number;
  cacheHits: number;
  durationMs: number;
};

function getOrCreate(map: Map<string, AggregateRow>, key: string): AggregateRow {
  const row = map.get(key);
  if (row) return row;
  const next: AggregateRow = {
    calls: 0,
    tokens: 0,
    costUsd: 0,
    retries: 0,
    cacheHits: 0,
    durationMs: 0,
  };
  map.set(key, next);
  return next;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const url = new URL(request.url);
    const take = Math.min(1000, Math.max(10, Number(url.searchParams.get("take") || "300")));

    const tasks = await prisma.adminBackgroundTask.findMany({
      where: { userId: admin.id },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        result: true,
      },
    });

    const byType = new Map<string, AggregateRow>();
    const byModel = new Map<string, AggregateRow>();

    for (const task of tasks) {
      const result = (task.result as any) || {};
      const telemetry = result.llmTelemetry || null;
      if (!telemetry) continue;

      const typeAgg = getOrCreate(byType, task.type);
      typeAgg.calls += 1;
      typeAgg.tokens += Number(telemetry.totalTokens || 0);
      typeAgg.costUsd += Number(telemetry.estimatedCostUsd || 0);
      typeAgg.retries += Number(telemetry.retryCount || 0);
      typeAgg.cacheHits += telemetry.cacheHit ? 1 : 0;
      typeAgg.durationMs += Number(telemetry.durationMs || 0);

      const modelAgg = getOrCreate(byModel, telemetry.model || "unknown");
      modelAgg.calls += 1;
      modelAgg.tokens += Number(telemetry.totalTokens || 0);
      modelAgg.costUsd += Number(telemetry.estimatedCostUsd || 0);
      modelAgg.retries += Number(telemetry.retryCount || 0);
      modelAgg.cacheHits += telemetry.cacheHit ? 1 : 0;
      modelAgg.durationMs += Number(telemetry.durationMs || 0);
    }

    const serialize = (map: Map<string, AggregateRow>) =>
      Array.from(map.entries()).map(([key, row]) => ({
        key,
        calls: row.calls,
        totalTokens: row.tokens,
        estimatedCostUsd: Number(row.costUsd.toFixed(6)),
        avgRetries: row.calls ? Number((row.retries / row.calls).toFixed(3)) : 0,
        cacheHitRate: row.calls ? Number((row.cacheHits / row.calls).toFixed(3)) : 0,
        avgDurationMs: row.calls ? Math.round(row.durationMs / row.calls) : 0,
      }));

    return successResponse({
      sampledTasks: tasks.length,
      byType: serialize(byType),
      byModel: serialize(byModel),
    });
  } catch (error) {
    return handleError(error);
  }
}
