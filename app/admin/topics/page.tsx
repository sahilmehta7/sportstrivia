import { AdminTopicsClient } from "./AdminTopicsClient";
import { prisma } from "@/lib/db";
import {
  filterTopicsWithAncestors,
  getAvailableTopicLevels,
  type AdminTopicSchemaType,
} from "@/lib/admin/topic-tree-filtering";

interface TopicsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type TopicSchemaFilter = "all" | "needs-config" | AdminTopicSchemaType;

const VALID_SCHEMA_FILTERS = new Set<TopicSchemaFilter>([
  "all",
  "needs-config",
  "NONE",
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_ORGANIZATION",
  "SPORTS_EVENT",
]);

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const params = await searchParams;
  const search = typeof params?.search === "string" ? params.search.trim() : "";
  const schemaParam = typeof params?.schema === "string" ? params.schema : "all";
  const schema = VALID_SCHEMA_FILTERS.has(schemaParam as TopicSchemaFilter)
    ? (schemaParam as TopicSchemaFilter)
    : "all";
  const levelParam = typeof params?.level === "string" ? params.level : "";
  const parsedLevel = Number(levelParam);
  const level =
    levelParam.length > 0 && Number.isInteger(parsedLevel) && parsedLevel >= 0
      ? parsedLevel
      : undefined;

  // Fetch all topics once; filtering is done in-memory so ancestor context is preserved.
  const allTopics = await prisma.topic.findMany({
    orderBy: { name: "asc" },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          questions: true,
          children: true,
          quizTopicConfigs: true,
        },
      },
    },
  });

  const availableLevels = getAvailableTopicLevels(allTopics);
  const { rootTopics, directMatchCount, includedCount } = filterTopicsWithAncestors(
    allTopics,
    {
      search,
      schema,
      level,
    }
  );

  return (
    <AdminTopicsClient
      topics={rootTopics}
      allTopics={allTopics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        level: topic.level,
        parentId: topic.parentId,
      }))}
      filters={{
        search,
        schema,
        level: level === undefined ? "" : String(level),
      }}
      filterOptions={{
        levels: availableLevels,
      }}
      counts={{
        total: allTopics.length,
        matched: includedCount,
        directMatches: directMatchCount,
      }}
    />
  );
}
