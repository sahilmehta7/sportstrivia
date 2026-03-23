/** @jest-environment node */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

var prismaMock: {
  topic: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  topicRelation: {
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    topic: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    topicRelation: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return { prisma: prismaMock };
});

import { requireAdmin } from "@/lib/auth-helpers";
import { GET as getAdminRelations, POST as postAdminRelation } from "@/app/api/admin/topics/[id]/relations/route";
import { PATCH as patchAdminRelation, DELETE as deleteAdminRelation } from "@/app/api/admin/topics/[id]/relations/[relationId]/route";
import { GET as getAdminReadiness } from "@/app/api/admin/topics/[id]/readiness/route";
import { GET as getPublicRelations } from "@/app/api/topics/[slug]/relations/route";

describe("topic relation routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1", role: "ADMIN" });
  });

  it("creates an admin topic relation", async () => {
    prismaMock.topic.findUnique
      .mockResolvedValueOnce({
        id: "athlete_1",
        schemaType: "ATHLETE",
      })
      .mockResolvedValueOnce({
        id: "team_1",
        schemaType: "SPORTS_TEAM",
      });

    prismaMock.topicRelation.create.mockResolvedValue({
      id: "rel_1",
      fromTopicId: "athlete_1",
      toTopicId: "team_1",
      relationType: "PLAYS_FOR",
    });
    prismaMock.topic.findUnique.mockResolvedValueOnce({
      id: "athlete_1",
      schemaType: "ATHLETE",
      schemaCanonicalUrl: "https://example.com/athlete",
      schemaEntityData: { athleteName: "Player" },
      outgoingRelations: [
        {
          fromTopicId: "athlete_1",
          toTopicId: "sport_1",
          relationType: "BELONGS_TO_SPORT",
        },
      ],
    });
    prismaMock.topic.update.mockResolvedValue({
      id: "athlete_1",
      entityStatus: "READY",
    });

    const request = new Request("http://localhost/api/admin/topics/athlete_1/relations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toTopicId: "team_1",
        relationType: "PLAYS_FOR",
      }),
    });

    const response = await postAdminRelation(request as any, {
      params: Promise.resolve({ id: "athlete_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      id: "rel_1",
      relationType: "PLAYS_FOR",
    });
    expect(prismaMock.topic.update).toHaveBeenCalledWith({
      where: { id: "athlete_1" },
      data: expect.objectContaining({
        entityStatus: "READY",
      }),
    });
  });

  it("returns readiness for a typed topic", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "team_1",
      schemaType: "SPORTS_TEAM",
      schemaCanonicalUrl: "https://example.com/team",
      schemaEntityData: { sportName: "Cricket" },
      outgoingRelations: [
        {
          fromTopicId: "team_1",
          toTopicId: "sport_1",
          relationType: "BELONGS_TO_SPORT",
        },
      ],
    });

    const response = await getAdminReadiness({} as any, {
      params: Promise.resolve({ id: "team_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      isReady: true,
      entityStatus: "READY",
    });
  });

  it("lists public relations by topic slug", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "team_1",
      slug: "india-cricket-team",
      name: "India",
      schemaType: "SPORTS_TEAM",
      outgoingRelations: [
        {
          id: "rel_1",
          relationType: "BELONGS_TO_SPORT",
          toTopic: {
            id: "sport_1",
            name: "Cricket",
            slug: "cricket",
            schemaType: "SPORT",
          },
        },
      ],
      incomingRelations: [],
    });

    const response = await getPublicRelations({} as any, {
      params: Promise.resolve({ slug: "india-cricket-team" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.relations).toEqual([
      expect.objectContaining({
        relationType: "BELONGS_TO_SPORT",
        relatedTopic: expect.objectContaining({
          slug: "cricket",
        }),
      }),
    ]);
  });

  it("updates an admin topic relation", async () => {
    prismaMock.topic.findUnique
      .mockResolvedValueOnce({
        id: "athlete_1",
        schemaType: "ATHLETE",
      })
      .mockResolvedValueOnce({
        id: "team_1",
        schemaType: "SPORTS_TEAM",
      });

    prismaMock.topicRelation.update.mockResolvedValue({
      id: "rel_1",
      fromTopicId: "athlete_1",
      toTopicId: "team_1",
      relationType: "PLAYS_FOR",
    });
    prismaMock.topic.findUnique.mockResolvedValueOnce({
      id: "athlete_1",
      schemaType: "ATHLETE",
      schemaCanonicalUrl: "https://example.com/athlete",
      schemaEntityData: { athleteName: "Player" },
      outgoingRelations: [
        {
          fromTopicId: "athlete_1",
          toTopicId: "sport_1",
          relationType: "BELONGS_TO_SPORT",
        },
      ],
    });
    prismaMock.topic.update.mockResolvedValue({
      id: "athlete_1",
      entityStatus: "READY",
    });

    const request = new Request("http://localhost/api/admin/topics/athlete_1/relations/rel_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toTopicId: "team_1",
        relationType: "PLAYS_FOR",
      }),
    });

    const response = await patchAdminRelation(request as any, {
      params: Promise.resolve({ id: "athlete_1", relationId: "rel_1" }),
    });

    expect(response.status).toBe(200);
    expect(prismaMock.topic.update).toHaveBeenCalled();
  });

  it("deletes an admin topic relation", async () => {
    prismaMock.topicRelation.delete.mockResolvedValue({ id: "rel_1" });
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "athlete_1",
      schemaType: "ATHLETE",
      schemaCanonicalUrl: "https://example.com/athlete",
      schemaEntityData: { athleteName: "Player" },
      outgoingRelations: [
        {
          fromTopicId: "athlete_1",
          toTopicId: "sport_1",
          relationType: "BELONGS_TO_SPORT",
        },
      ],
    });
    prismaMock.topic.update.mockResolvedValue({
      id: "athlete_1",
      entityStatus: "READY",
    });

    const response = await deleteAdminRelation({} as any, {
      params: Promise.resolve({ id: "athlete_1", relationId: "rel_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toContain("deleted");
    expect(prismaMock.topic.update).toHaveBeenCalled();
  });

  it("lists admin topic relations", async () => {
    prismaMock.topicRelation.findMany.mockResolvedValue([
      {
        id: "rel_1",
        fromTopicId: "athlete_1",
        toTopicId: "team_1",
        relationType: "PLAYS_FOR",
        fromTopic: {
          id: "athlete_1",
          name: "Virat Kohli",
          slug: "virat-kohli",
          schemaType: "ATHLETE",
        },
        toTopic: {
          id: "team_1",
          name: "India",
          slug: "india-cricket-team",
          schemaType: "SPORTS_TEAM",
        },
      },
    ]);

    const response = await getAdminRelations({} as any, {
      params: Promise.resolve({ id: "athlete_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.relations).toHaveLength(1);
    expect(body.data.relations[0].toTopic.slug).toBe("india-cricket-team");
  });
});
