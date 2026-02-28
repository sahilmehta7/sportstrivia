export type AdminTopicSchemaType =
  | "NONE"
  | "SPORT"
  | "SPORTS_TEAM"
  | "ATHLETE"
  | "SPORTS_ORGANIZATION"
  | "SPORTS_EVENT";

export type AdminTopicRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  schemaType: AdminTopicSchemaType;
  schemaCanonicalUrl: string | null;
  schemaSameAs: string[];
  schemaEntityData: unknown;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  _count: {
    questions: number;
    children: number;
    quizTopicConfigs: number;
  };
};

export type TopicTreeNode = AdminTopicRow & { children: TopicTreeNode[] };

export type TopicFilters = {
  search?: string;
  schema?: string;
  level?: number;
};

export function getAvailableTopicLevels(topics: AdminTopicRow[]): number[] {
  return [...new Set(topics.map((topic) => topic.level))].sort((a, b) => a - b);
}

export function filterTopicsWithAncestors(
  topics: AdminTopicRow[],
  filters: TopicFilters
): {
  rootTopics: TopicTreeNode[];
  directMatchCount: number;
  includedCount: number;
} {
  const idToTopic = new Map(topics.map((topic) => [topic.id, topic]));
  const directMatchIds = new Set<string>();

  for (const topic of topics) {
    if (matchesTopic(topic, filters)) {
      directMatchIds.add(topic.id);
    }
  }

  const includedIds = new Set<string>();
  for (const topicId of directMatchIds) {
    let currentId: string | null = topicId;
    while (currentId) {
      if (includedIds.has(currentId)) break;
      includedIds.add(currentId);
      currentId = idToTopic.get(currentId)?.parentId ?? null;
    }
  }

  return {
    rootTopics: buildTopicTree(
      topics.filter((topic) => includedIds.has(topic.id))
    ),
    directMatchCount: directMatchIds.size,
    includedCount: includedIds.size,
  };
}

function matchesTopic(topic: AdminTopicRow, filters: TopicFilters): boolean {
  const searchTerm = filters.search?.trim().toLowerCase();
  const schemaFilter = filters.schema?.trim();
  const levelFilter = typeof filters.level === "number" ? filters.level : undefined;

  if (searchTerm) {
    const haystacks = [topic.name, topic.slug, topic.description ?? ""];
    const matchesSearch = haystacks.some((value) =>
      value.toLowerCase().includes(searchTerm)
    );
    if (!matchesSearch) return false;
  }

  if (schemaFilter && schemaFilter !== "all") {
    if (schemaFilter === "needs-config") {
      if (topic.schemaType !== "NONE") return false;
    } else if (topic.schemaType !== schemaFilter) {
      return false;
    }
  }

  if (levelFilter !== undefined && topic.level !== levelFilter) {
    return false;
  }

  return true;
}

function buildTopicTree(topics: AdminTopicRow[]): TopicTreeNode[] {
  const topicMap = new Map<string, TopicTreeNode>();
  const rootTopics: TopicTreeNode[] = [];

  for (const topic of topics) {
    topicMap.set(topic.id, { ...topic, children: [] });
  }

  for (const topic of topics) {
    const node = topicMap.get(topic.id);
    if (!node) continue;

    if (topic.parentId) {
      const parent = topicMap.get(topic.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        rootTopics.push(node);
      }
    } else {
      rootTopics.push(node);
    }
  }

  sortTopicNodes(rootTopics);
  return rootTopics;
}

function sortTopicNodes(nodes: TopicTreeNode[]) {
  nodes.sort((a, b) => a.name.localeCompare(b.name));
  for (const node of nodes) {
    sortTopicNodes(node.children);
  }
}
