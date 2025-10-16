import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { ReportStatus } from "@prisma/client";

const reportSchema = z.object({
  category: z.enum(["INAPPROPRIATE", "INCORRECT", "OFFENSIVE", "DUPLICATE", "OTHER"]),
  description: z.string().min(10).max(1000),
});

// POST /api/questions/[id]/report - Report a question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: questionId } = await params;
    const body = await request.json();
    const { category, description } = reportSchema.parse(body);

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    // Check if user already reported this question
    const existingReport = await prisma.questionReport.findFirst({
      where: {
        userId: user.id,
        questionId,
        status: {
          in: [ReportStatus.PENDING, ReportStatus.REVIEWING],
        },
      },
    });

    if (existingReport) {
      throw new BadRequestError("You have already reported this question");
    }

    // Create report
    const report = await prisma.questionReport.create({
      data: {
        userId: user.id,
        questionId,
        category,
        description,
        status: ReportStatus.PENDING,
      },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
          },
        },
      },
    });

    return successResponse(
      { report, message: "Report submitted successfully. Our team will review it soon." },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

