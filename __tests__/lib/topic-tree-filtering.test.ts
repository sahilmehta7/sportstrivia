import {
  filterTopicsWithAncestors,
  getAvailableTopicLevels,
  type AdminTopicRow,
} from "@/lib/admin/topic-tree-filtering";

const makeTopic = (
  overrides: Partial<AdminTopicRow> & Pick<AdminTopicRow, "id" | "name" | "slug">
): AdminTopicRow => ({
  id: overrides.id,
  name: overrides.name,
  slug: overrides.slug,
  description: overrides.description ?? null,
  level: overrides.level ?? 0,
  schemaType: overrides.schemaType ?? "NONE",
  schemaCanonicalUrl: overrides.schemaCanonicalUrl ?? null,
  schemaSameAs: overrides.schemaSameAs ?? [],
  schemaEntityData: overrides.schemaEntityData ?? null,
  parentId: overrides.parentId ?? null,
  parent: overrides.parent ?? null,
  _count: overrides._count ?? {
    questions: 0,
    children: 0,
    quizTopicConfigs: 0,
  },
});

describe("topic tree filtering", () => {
  const topics: AdminTopicRow[] = [
    makeTopic({ id: "root_1", name: "Sports", slug: "sports", level: 0 }),
    makeTopic({
      id: "child_1",
      name: "Basketball",
      slug: "basketball",
      level: 1,
      parentId: "root_1",
      parent: { id: "root_1", name: "Sports" },
      schemaType: "SPORT",
    }),
    makeTopic({
      id: "leaf_1",
      name: "NBA Legends",
      slug: "nba-legends",
      description: "History and records",
      level: 2,
      parentId: "child_1",
      parent: { id: "child_1", name: "Basketball" },
      schemaType: "ATHLETE",
    }),
    makeTopic({ id: "root_2", name: "Music", slug: "music", level: 0 }),
    makeTopic({
      id: "child_2",
      name: "Classical",
      slug: "classical",
      level: 1,
      parentId: "root_2",
      parent: { id: "root_2", name: "Music" },
      schemaType: "SPORTS_EVENT",
    }),
  ];

  it("includes matching topics and their ancestors only", () => {
    const result = filterTopicsWithAncestors(topics, { search: "nba" });

    expect(result.directMatchCount).toBe(1);
    expect(result.includedCount).toBe(3);
    expect(result.rootTopics.map((topic) => topic.id)).toEqual(["root_1"]);
    expect(result.rootTopics[0].children.map((topic) => topic.id)).toEqual(["child_1"]);
    expect(result.rootTopics[0].children[0].children.map((topic) => topic.id)).toEqual([
      "leaf_1",
    ]);
  });

  it("supports search by slug and description", () => {
    const bySlug = filterTopicsWithAncestors(topics, { search: "classical" });
    const byDescription = filterTopicsWithAncestors(topics, { search: "records" });

    expect(bySlug.directMatchCount).toBe(1);
    expect(bySlug.rootTopics.map((topic) => topic.id)).toEqual(["root_2"]);
    expect(byDescription.directMatchCount).toBe(1);
    expect(byDescription.rootTopics.map((topic) => topic.id)).toEqual(["root_1"]);
  });

  it("applies schema and level filters with AND semantics", () => {
    const result = filterTopicsWithAncestors(topics, {
      schema: "ATHLETE",
      level: 2,
    });
    const noneResult = filterTopicsWithAncestors(topics, {
      schema: "ATHLETE",
      level: 1,
    });
    const needsConfig = filterTopicsWithAncestors(topics, {
      schema: "needs-config",
    });

    expect(result.directMatchCount).toBe(1);
    expect(result.includedCount).toBe(3);
    expect(noneResult.directMatchCount).toBe(0);
    expect(noneResult.includedCount).toBe(0);
    expect(needsConfig.directMatchCount).toBe(2);
  });

  it("returns unique sorted levels", () => {
    expect(getAvailableTopicLevels(topics)).toEqual([0, 1, 2]);
  });
});
