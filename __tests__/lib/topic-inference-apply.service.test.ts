jest.mock("@/lib/db", () => ({
  prisma: {
    topicRelation: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/topic-graph/topic-readiness.persistence", () => ({
  syncTopicEntityReadiness: jest.fn(),
}));

import { prisma } from "@/lib/db";
import { syncTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";
import { applyInferredSportRelations } from "@/lib/topic-graph/topic-inference-apply.service";

const inferred = [
  {
    fromTopicId: "team_1",
    toTopicId: "sport_1",
    relationType: "BELONGS_TO_SPORT" as const,
    reason: "nearest_sport_ancestor",
  },
  {
    fromTopicId: "event_1",
    toTopicId: "sport_1",
    relationType: "BELONGS_TO_SPORT" as const,
    reason: "nearest_sport_ancestor",
  },
  {
    fromTopicId: "team_2",
    toTopicId: "event_x",
    relationType: "COMPETES_IN" as const,
    reason: "should_not_write",
  },
];

describe("applyInferredSportRelations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.topicRelation.upsert as jest.Mock).mockResolvedValue({ id: "rel_1" });
    (syncTopicEntityReadiness as jest.Mock).mockResolvedValue({ entityStatus: "READY" });
  });

  it("writes only missing BELONGS_TO_SPORT relations and recomputes readiness", async () => {
    const result = await applyInferredSportRelations({
      inferredRelations: inferred,
      anomalyTopicIds: ["team_2"],
    });

    expect(prisma.topicRelation.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.topicRelation.upsert).toHaveBeenCalledWith({
      where: {
        fromTopicId_toTopicId_relationType: {
          fromTopicId: "team_1",
          toTopicId: "sport_1",
          relationType: "BELONGS_TO_SPORT",
        },
      },
      update: {},
      create: {
        fromTopicId: "team_1",
        toTopicId: "sport_1",
        relationType: "BELONGS_TO_SPORT",
      },
    });
    expect(syncTopicEntityReadiness).toHaveBeenCalledWith("team_1");
    expect(result.appliedCount).toBe(2);
    expect(result.skippedCount).toBe(1);
  });

  it("never writes non-safe relations", async () => {
    await applyInferredSportRelations({
      inferredRelations: inferred,
      anomalyTopicIds: [],
    });

    expect(prisma.topicRelation.upsert).not.toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ relationType: "COMPETES_IN" }),
      })
    );
  });
});
