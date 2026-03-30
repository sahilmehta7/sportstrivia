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

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/services/collection.service", () => ({
  listPublishedCollections: jest.fn(),
  getPublishedCollectionDetail: jest.fn(),
  startOrResumeCollection: jest.fn(),
  listUserInProgressCollections: jest.fn(),
  createCollection: jest.fn(),
  listAdminCollections: jest.fn(),
  updateCollection: jest.fn(),
  addQuizToCollection: jest.fn(),
  reorderCollectionQuizzes: jest.fn(),
  removeQuizFromCollection: jest.fn(),
}));

jest.mock("@/lib/services/route-reference.service", () => ({
  resolveCollectionIdFromPathReference: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { requireAdmin, requireAuth } from "@/lib/auth-helpers";
import * as collectionService from "@/lib/services/collection.service";
import { resolveCollectionIdFromPathReference } from "@/lib/services/route-reference.service";
import { GET as getCollections } from "@/app/api/collections/route";
import { GET as getCollectionBySlug } from "@/app/api/collections/[slug]/route";
import { POST as startOrResume } from "@/app/api/collections/[slug]/start-or-resume/route";
import { GET as getUserCollectionProgress } from "@/app/api/users/me/collections/progress/route";
import {
  GET as getAdminCollections,
  POST as createAdminCollection,
} from "@/app/api/admin/collections/route";
import { PATCH as patchAdminCollection } from "@/app/api/admin/collections/[id]/route";
import {
  POST as addAdminCollectionQuiz,
  PATCH as patchAdminCollectionQuizOrder,
  DELETE as deleteAdminCollectionQuiz,
} from "@/app/api/admin/collections/[id]/quizzes/route";

const serviceMocks = collectionService as unknown as {
  listPublishedCollections: jest.Mock;
  getPublishedCollectionDetail: jest.Mock;
  startOrResumeCollection: jest.Mock;
  listUserInProgressCollections: jest.Mock;
  createCollection: jest.Mock;
  listAdminCollections: jest.Mock;
  updateCollection: jest.Mock;
  addQuizToCollection: jest.Mock;
  reorderCollectionQuizzes: jest.Mock;
  removeQuizFromCollection: jest.Mock;
};
const routeReferenceMocks = {
  resolveCollectionIdFromPathReference:
    resolveCollectionIdFromPathReference as jest.Mock,
};

describe("collections routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user_1" } });
    (requireAuth as jest.Mock).mockResolvedValue({ id: "user_1", role: "USER" });
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    routeReferenceMocks.resolveCollectionIdFromPathReference.mockResolvedValue(
      "collection_1"
    );
  });

  it("returns published collections list", async () => {
    serviceMocks.listPublishedCollections.mockResolvedValue({
      collections: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 1, hasNext: false, hasPrevious: false },
    });

    const response = await getCollections(
      new Request("http://localhost/api/collections?page=1&limit=12") as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.listPublishedCollections).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      type: undefined,
      topicId: undefined,
      featured: undefined,
    });
    expect(body.success).toBe(true);
  });

  it("returns collection detail for slug", async () => {
    serviceMocks.getPublishedCollectionDetail.mockResolvedValue({
      id: "collection_1",
      slug: "ipl-collection",
      name: "IPL Collection",
      quizzes: [],
      progress: null,
    });

    const response = await getCollectionBySlug({} as any, {
      params: Promise.resolve({ slug: "ipl-collection" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.getPublishedCollectionDetail).toHaveBeenCalledWith(
      "ipl-collection",
      "user_1"
    );
    expect(body.data.slug).toBe("ipl-collection");
  });

  it("starts or resumes collection for authenticated user", async () => {
    serviceMocks.startOrResumeCollection.mockResolvedValue({
      collectionId: "collection_1",
      progress: { completedQuizCount: 2, totalQuizzes: 10 },
      nextQuiz: { id: "quiz_3", slug: "quiz-3", title: "Quiz 3", order: 3 },
    });

    const response = await startOrResume({} as any, {
      params: Promise.resolve({ slug: "collection_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.startOrResumeCollection).toHaveBeenCalledWith(
      "user_1",
      "collection_1"
    );
    expect(
      routeReferenceMocks.resolveCollectionIdFromPathReference
    ).toHaveBeenCalledWith("collection_1", { allowIdFallback: true });
    expect(body.data.nextQuiz.slug).toBe("quiz-3");
  });

  it("returns in-progress user collections", async () => {
    serviceMocks.listUserInProgressCollections.mockResolvedValue([
      { collectionId: "collection_1", collection: { slug: "ipl" }, progress: { completedQuizCount: 1 }, nextQuiz: null },
    ]);

    const response = await getUserCollectionProgress();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.listUserInProgressCollections).toHaveBeenCalledWith("user_1");
    expect(body.data.items).toHaveLength(1);
  });

  it("creates admin collection", async () => {
    serviceMocks.createCollection.mockResolvedValue({ id: "collection_1", slug: "ipl", name: "IPL" });

    const response = await createAdminCollection(
      new Request("http://localhost/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "IPL",
          type: "EDITORIAL",
          status: "DRAFT",
          isFeatured: true,
        }),
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(serviceMocks.createCollection).toHaveBeenCalled();
    expect(body.data.slug).toBe("ipl");
  });

  it("lists admin collections", async () => {
    serviceMocks.listAdminCollections.mockResolvedValue({
      collections: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrevious: false },
    });

    const response = await getAdminCollections(
      new Request("http://localhost/api/admin/collections?page=1&limit=20") as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.listAdminCollections).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      type: undefined,
    });
    expect(body.success).toBe(true);
  });

  it("updates admin collection", async () => {
    serviceMocks.updateCollection.mockResolvedValue({ id: "collection_1", status: "PUBLISHED" });

    const response = await patchAdminCollection(
      new Request("http://localhost/api/admin/collections/collection_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      }) as any,
      { params: Promise.resolve({ id: "collection_1" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.updateCollection).toHaveBeenCalledWith(
      "collection_1",
      expect.objectContaining({ status: "PUBLISHED" })
    );
    expect(body.data.status).toBe("PUBLISHED");
  });

  it("manages admin collection membership", async () => {
    const quizId = "ckm8z2v5s0000qz4n7b9x1y2z";
    serviceMocks.addQuizToCollection.mockResolvedValue({ quizId });
    serviceMocks.reorderCollectionQuizzes.mockResolvedValue([{ quizId, order: 1 }]);
    serviceMocks.removeQuizFromCollection.mockResolvedValue({ removed: true });

    const addResponse = await addAdminCollectionQuiz(
      new Request("http://localhost/api/admin/collections/collection_1/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, order: 1 }),
      }) as any,
      { params: Promise.resolve({ id: "collection_1" }) }
    );
    expect(addResponse.status).toBe(201);

    const reorderResponse = await patchAdminCollectionQuizOrder(
      new Request("http://localhost/api/admin/collections/collection_1/quizzes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ quizId, order: 1 }] }),
      }) as any,
      { params: Promise.resolve({ id: "collection_1" }) }
    );
    expect(reorderResponse.status).toBe(200);

    const removeResponse = await deleteAdminCollectionQuiz(
      new Request(
        `http://localhost/api/admin/collections/collection_1/quizzes?quizId=${quizId}`,
        { method: "DELETE" }
      ) as any,
      { params: Promise.resolve({ id: "collection_1" }) }
    );
    expect(removeResponse.status).toBe(200);
  });
});
