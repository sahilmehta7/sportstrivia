import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { dailyWordleImportSchema } from "@/lib/validations/daily-game-import.schema";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds

function addDaysToDateString(dateString: string, daysToAdd: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

/**
 * POST /api/admin/daily/import
 * Bulk import WORD daily games from a start date + list of words.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parseResult = dailyWordleImportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { startDate, words, overwriteExisting, allowOverwriteWithAttempts } = parseResult.data;

    const planned = words.map((word, idx) => ({
      date: addDaysToDateString(startDate, idx),
      targetValue: word,
      clues: { length: word.length, hint: "Sports-related term" },
    }));

    const dates = planned.map((p) => p.date);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyGame.findMany({
        where: { date: { in: dates } },
        select: { id: true, date: true, gameType: true },
      });

      const existingByDate = new Map(existing.map((g) => [g.date, g]));

      const attemptCountsByGameId = new Map<string, number>();
      if (overwriteExisting && existing.length > 0) {
        const counts = await tx.dailyGameAttempt.groupBy({
          by: ["dailyGameId"],
          where: { dailyGameId: { in: existing.map((g) => g.id) } },
          _count: { _all: true },
        });
        counts.forEach((c) => attemptCountsByGameId.set(c.dailyGameId, c._count._all));
      }

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      const conflicts: Array<{ date: string; reason: string }> = [];

      for (const item of planned) {
        const existingGame = existingByDate.get(item.date);

        if (existingGame) {
          if (!overwriteExisting) {
            skippedCount++;
            continue;
          }

          if (existingGame.gameType !== "WORD") {
            conflicts.push({
              date: item.date,
              reason: `Existing game type is ${existingGame.gameType}`,
            });
            continue;
          }

          const attemptsCount = attemptCountsByGameId.get(existingGame.id) ?? 0;
          if (attemptsCount > 0 && !allowOverwriteWithAttempts) {
            conflicts.push({
              date: item.date,
              reason: `Existing game has ${attemptsCount} attempts`,
            });
            continue;
          }

          await tx.dailyGame.update({
            where: { id: existingGame.id },
            data: {
              gameType: "WORD",
              targetValue: item.targetValue,
              clues: item.clues,
            },
          });
          updatedCount++;
          continue;
        }

        await tx.dailyGame.create({
          data: {
            date: item.date,
            gameType: "WORD",
            targetValue: item.targetValue,
            clues: item.clues,
          },
        });
        createdCount++;
      }

      return {
        startDate,
        total: planned.length,
        createdCount,
        updatedCount,
        skippedCount,
        conflictCount: conflicts.length,
        conflicts,
      };
    }, {
      maxWait: 30000,
      timeout: 60000,
    });

    return successResponse(result, 201);
  } catch (error) {
    return handleError(error);
  }
}
