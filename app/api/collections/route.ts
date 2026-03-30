import { NextRequest } from "next/server";
import { z } from "zod";
import { CollectionType } from "@prisma/client";
import { handleError, successResponse } from "@/lib/errors";
import { listPublishedCollections } from "@/lib/services/collection.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "12");
    const type = searchParams.get("type");
    const topicId = searchParams.get("topicId") ?? undefined;
    const featuredValue = searchParams.get("featured");
    const featured =
      featuredValue === null
        ? undefined
        : z
            .enum(["true", "false"])
            .transform((value) => value === "true")
            .parse(featuredValue);

    const result = await listPublishedCollections({
      page,
      limit,
      type: type ? z.nativeEnum(CollectionType).parse(type) : undefined,
      topicId: topicId ?? undefined,
      featured,
    });

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
