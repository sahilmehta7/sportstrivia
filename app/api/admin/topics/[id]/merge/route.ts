import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { mergeTopics, getDescendantTopicIds } from "@/lib/services/topic.service";
import { z } from "zod";

const mergeSchema = z.object({
    destinationId: z.string().cuid(),
});

// POST /api/admin/topics/[id]/merge - Merge source topic [id] into destination topic
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id: sourceId } = await params;

        const body = await request.json();
        const { destinationId } = mergeSchema.parse(body);

        if (sourceId === destinationId) {
            throw new Error("Cannot merge a topic into itself");
        }

        // Check for circular references (destination cannot be a descendant of source)
        const descendants = await getDescendantTopicIds(sourceId);
        if (descendants.includes(destinationId)) {
            throw new Error("Cannot merge a topic into one of its descendants");
        }

        await mergeTopics(sourceId, destinationId);

        return successResponse({ message: "Topics merged successfully" });
    } catch (error) {
        return handleError(error);
    }
}
