import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { processAIQuizTask } from "@/lib/services/ai-quiz-processor.service";

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Increase route timeout for AI generation (can take 30-60 seconds for large quizzes)
// NOTE: Vercel timeout limits:
// - Hobby plan: 10 seconds max
// - Pro plan: 60 seconds max
// - Enterprise: Up to 300 seconds
// This route may timeout on Hobby/Pro plans. The main route uses after() for reliable processing.
export const maxDuration = 300; // 5 minutes - only honored on Enterprise plan

/**
 * POST /api/admin/ai/generate-quiz/process
 * 
 * Process a pending AI quiz task.
 * 
 * DEPRECATED: This route is kept for backwards compatibility and manual/external invocation.
 * The main route (/api/admin/ai/generate-quiz) now uses Next.js after() to process tasks
 * directly without requiring this HTTP endpoint.
 * 
 * For internal calls, you can bypass auth by setting x-internal-call header.
 * For external/manual calls, admin authentication is required.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is an internal call (from same deployment)
    const isInternalCall = request.headers.get('x-internal-call') === 'true';
    
    // Only require admin auth for external calls
    if (!isInternalCall) {
      await requireAdmin();
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return handleError(new Error("taskId is required"));
    }

    await processAIQuizTask(taskId);

    return successResponse({
      taskId,
      status: "completed",
      message: "Task processing completed",
    });
  } catch (error) {
    return handleError(error);
  }
}

