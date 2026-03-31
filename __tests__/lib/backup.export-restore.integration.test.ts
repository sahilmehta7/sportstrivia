/** @jest-environment node */

type Row = Record<string, unknown>;
type TableStore = Record<string, Row[]>;

const TEST_BACKUP_TABLES = [
  { model: "User", delegate: "user" },
  { model: "Topic", delegate: "topic" },
  { model: "Quiz", delegate: "quiz" },
  { model: "TopicRelation", delegate: "topicRelation" },
  { model: "UserInterestPreference", delegate: "userInterestPreference" },
  { model: "UserFollowedTopic", delegate: "userFollowedTopic" },
  { model: "UserDiscoveryPreference", delegate: "userDiscoveryPreference" },
  { model: "Collection", delegate: "collection" },
  { model: "CollectionQuiz", delegate: "collectionQuiz" },
  { model: "UserCollectionProgress", delegate: "userCollectionProgress" },
] as const;

const trackedModels = TEST_BACKUP_TABLES.map((table) => table.model);

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const store: TableStore = {
  User: [],
  Topic: [],
  Quiz: [],
  TopicRelation: [],
  UserInterestPreference: [],
  UserFollowedTopic: [],
  UserDiscoveryPreference: [],
  Collection: [],
  CollectionQuiz: [],
  UserCollectionProgress: [],
  AdminBackgroundTask: [],
};

function sortRows(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

function createDelegate(model: string) {
  return {
    findMany: jest.fn(async (args?: { orderBy?: Record<string, "asc" | "desc"> }) => {
      const rows = deepClone(store[model] ?? []);
      const orderBy = args?.orderBy;
      if (!orderBy) return rows;
      const [key, direction] = Object.entries(orderBy)[0] ?? [];
      if (!key || !direction) return rows;
      return [...rows].sort((a, b) => {
        const left = a[key];
        const right = b[key];
        if (left === right) return 0;
        const cmp = String(left ?? "").localeCompare(String(right ?? ""));
        return direction === "asc" ? cmp : -cmp;
      });
    }),
    createMany: jest.fn(async (args: { data: Row[]; skipDuplicates?: boolean }) => {
      let inserted = 0;
      for (const row of args.data) {
        const candidate = deepClone(row);
        const id = candidate.id;
        const hasDuplicate = id != null && (store[model] ?? []).some((existing) => existing.id === id);
        if (hasDuplicate && args.skipDuplicates) continue;
        (store[model] ??= []).push(candidate);
        inserted += 1;
      }
      return { count: inserted };
    }),
  };
}

var prismaMock: any;

jest.mock("@/lib/backup/table-config", () => ({
  BACKUP_TABLES: [
    { model: "User", delegate: "user" },
    { model: "Topic", delegate: "topic" },
    { model: "Quiz", delegate: "quiz" },
    { model: "TopicRelation", delegate: "topicRelation" },
    { model: "UserInterestPreference", delegate: "userInterestPreference" },
    { model: "UserFollowedTopic", delegate: "userFollowedTopic" },
    { model: "UserDiscoveryPreference", delegate: "userDiscoveryPreference" },
    { model: "Collection", delegate: "collection" },
    { model: "CollectionQuiz", delegate: "collectionQuiz" },
    { model: "UserCollectionProgress", delegate: "userCollectionProgress" },
  ],
}));

jest.mock("@/lib/db", () => {
  prismaMock = {
    user: createDelegate("User"),
    topic: createDelegate("Topic"),
    quiz: createDelegate("Quiz"),
    topicRelation: createDelegate("TopicRelation"),
    userInterestPreference: createDelegate("UserInterestPreference"),
    userFollowedTopic: createDelegate("UserFollowedTopic"),
    userDiscoveryPreference: createDelegate("UserDiscoveryPreference"),
    collection: createDelegate("Collection"),
    collectionQuiz: createDelegate("CollectionQuiz"),
    userCollectionProgress: createDelegate("UserCollectionProgress"),
    adminBackgroundTask: {
      findMany: jest.fn(async () => deepClone(store.AdminBackgroundTask)),
      createMany: jest.fn(async (args: { data: Row[]; skipDuplicates?: boolean }) => {
        let inserted = 0;
        for (const row of args.data) {
          const candidate = deepClone(row);
          const id = candidate.id;
          const hasDuplicate = id != null && store.AdminBackgroundTask.some((existing) => existing.id === id);
          if (hasDuplicate && args.skipDuplicates) continue;
          store.AdminBackgroundTask.push(candidate);
          inserted += 1;
        }
        return { count: inserted };
      }),
    },
    $queryRawUnsafe: jest.fn(async () => []),
    $executeRawUnsafe: jest.fn(async (sql: string) => {
      if (sql.includes("TRUNCATE TABLE")) {
        const models = Array.from(sql.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
        for (const model of models) {
          if (store[model]) store[model] = [];
        }
        return 0;
      }
      if (sql.includes("pg_get_serial_sequence")) {
        return 0;
      }
      return 0;
    }),
    $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prismaMock)),
  };
  return { prisma: prismaMock };
});

jest.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: jest.fn(() => false),
  getSupabaseClient: jest.fn(),
}));

jest.mock("@/lib/services/restore-lock.service", () => ({
  appendBackupAuditEvent: jest.fn(async () => undefined),
  setRestoreLock: jest.fn(async () => undefined),
}));

import { createEncryptedBackupSnapshot } from "@/lib/services/backup-export.service";
import { restoreBackupFromBuffer } from "@/lib/services/backup-restore.service";

describe("backup export/restore integration for topic + collection models", () => {
  beforeEach(() => {
    process.env.BACKUP_ENCRYPTION_KEY = "test-backup-encryption-key-123";
    for (const key of Object.keys(store)) {
      store[key] = [];
    }
    jest.clearAllMocks();
  });

  it("round-trips new topic/collection/user-state models and fields through backup + restore", async () => {
    const now = new Date("2026-03-31T00:00:00.000Z").toISOString();

    store.User = [
      {
        id: "user_1",
        email: "u1@example.com",
        name: "User One",
        role: "USER",
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.Topic = [
      {
        id: "topic_1",
        name: "Real Madrid",
        slug: "real-madrid",
        schemaType: "SPORTS_TEAM",
        schemaCanonicalUrl: "https://example.com/topics/real-madrid",
        schemaSameAs: ["https://en.wikipedia.org/wiki/Real_Madrid_CF"],
        alternateNames: ["Los Blancos"],
        schemaEntityData: { founded: 1902, country: "Spain" },
        entityStatus: "READY",
        contentStatus: "PUBLISHED",
        indexEligible: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "topic_2",
        name: "Football",
        slug: "football",
        schemaType: "SPORT",
        schemaSameAs: [],
        alternateNames: ["Soccer"],
        entityStatus: "READY",
        contentStatus: "PUBLISHED",
        indexEligible: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.Quiz = [
      {
        id: "quiz_1",
        title: "Legends Quiz",
        slug: "legends-quiz",
        status: "PUBLISHED",
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.TopicRelation = [
      {
        id: "rel_1",
        fromTopicId: "topic_1",
        toTopicId: "topic_2",
        relationType: "BELONGS_TO_SPORT",
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.UserInterestPreference = [
      {
        id: "interest_1",
        userId: "user_1",
        topicId: "topic_1",
        source: "PROFILE",
        strength: 0.8,
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.UserFollowedTopic = [
      {
        id: "follow_1",
        userId: "user_1",
        topicId: "topic_1",
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.UserDiscoveryPreference = [
      {
        id: "discover_1",
        userId: "user_1",
        preferredDifficulty: "HARD",
        preferredPlayModes: ["TIMED", "CLASSIC"],
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.Collection = [
      {
        id: "collection_1",
        name: "European Giants",
        slug: "european-giants",
        status: "PUBLISHED",
        type: "EDITORIAL",
        isFeatured: true,
        primaryTopicId: "topic_1",
        rulesJson: { rotation: "weekly", maxItems: 25 },
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.CollectionQuiz = [
      {
        id: "collection_quiz_1",
        collectionId: "collection_1",
        quizId: "quiz_1",
        order: 1,
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.UserCollectionProgress = [
      {
        id: "progress_1",
        userId: "user_1",
        collectionId: "collection_1",
        lastQuizId: "quiz_1",
        startedAt: now,
        lastPlayedAt: now,
        completedQuizCount: 1,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ];

    store.AdminBackgroundTask = [
      {
        id: "task_live",
        type: "BACKUP_RESTORE",
        status: "PENDING",
        attempt: 1,
        cancelledAt: null,
        cancelledAttempt: null,
        label: "Live task",
        input: {},
        result: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const expected = Object.fromEntries(
      trackedModels.map((model) => [model, sortRows(deepClone(store[model]))])
    );

    const snapshot = await createEncryptedBackupSnapshot();

    for (const model of trackedModels) {
      store[model] = [];
    }
    store.AdminBackgroundTask = [
      {
        id: "task_live",
        type: "BACKUP_RESTORE",
        status: "PENDING",
        attempt: 1,
        cancelledAt: null,
        cancelledAttempt: null,
        label: "Live task",
        input: {},
        result: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const report = await restoreBackupFromBuffer({
      fileBuffer: snapshot.encryptedBuffer,
      actorId: "admin_1",
    });

    expect(report.success).toBe(true);
    expect(report.errors).toEqual([]);

    for (const model of trackedModels) {
      expect(sortRows(store[model])).toEqual(expected[model]);
    }

    expect(store.AdminBackgroundTask).toHaveLength(1);
    expect(store.AdminBackgroundTask[0]?.id).toBe("task_live");
  });
});
