import { AdminTopicsClient } from "./AdminTopicsClient";
import { prisma } from "@/lib/db";

// Recursive type for our constructed tree
type TopicWithChildren = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  schemaType: string;
  schemaCanonicalUrl: string | null;
  schemaSameAs: string[];
  schemaEntityData: unknown;
  parent: { name: string } | null;
  parentId: string | null;
  _count: {
    questions: number;
    children: number;
    quizTopicConfigs: number;
  };
  children: TopicWithChildren[];
};

export default async function TopicsPage() {
  // Fetch ALL topics flatly
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
      // We don't include children here because we'll reconstruct the tree manually
    },
  });

  // Reconstruct the tree
  const topicMap = new Map<string, TopicWithChildren>();
  const rootTopics: TopicWithChildren[] = [];

  // First pass: create nodes
  allTopics.forEach((topic) => {
    topicMap.set(topic.id, { ...topic, children: [] });
  });

  // Second pass: link children to parents
  allTopics.forEach((topic) => {
    const node = topicMap.get(topic.id)!;
    if (topic.parentId) {
      const parent = topicMap.get(topic.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // If parent not found (shouldn't happen with referential integrity), treat as root
        rootTopics.push(node);
      }
    } else {
      rootTopics.push(node);
    }
  });

  // Optional: sort children by name again if needed (DB sort might be enough but safer here)
  const sortTopics = (nodes: TopicWithChildren[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => sortTopics(node.children));
  };

  sortTopics(rootTopics);

  return <AdminTopicsClient topics={rootTopics} />;
}
