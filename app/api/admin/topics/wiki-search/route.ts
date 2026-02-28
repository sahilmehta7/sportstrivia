import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, BadRequestError, NotFoundError, successResponse } from "@/lib/errors";
import { lookupWikipediaTopicMetadata } from "@/lib/admin/topic-wikipedia";

const wikiSearchSchema = z.object({
  query: z.string().min(2, "Query must be at least 2 characters"),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { query } = wikiSearchSchema.parse(body);
    const queryText = query.trim();
    if (!queryText) {
      throw new BadRequestError("Query is required");
    }

    try {
      const metadata = await lookupWikipediaTopicMetadata(queryText);
      return successResponse(metadata);
    } catch (error: any) {
      const message = error?.message || "Wikipedia lookup failed";
      if (message.includes("No Wikipedia result found") || message.includes("No Wikipedia page details found")) {
        throw new NotFoundError(message);
      }
      throw new Error(message);
    }
  } catch (error) {
    return handleError(error);
  }
}
