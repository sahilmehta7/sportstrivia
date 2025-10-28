import { AdminTopicsClient } from "./AdminTopicsClient";
import { prisma } from "@/lib/db";

export default async function TopicsPage() {
  const topics = await prisma.topic.findMany({
    where: { parentId: null },
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
      children: {
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
          children: {
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
          },
        },
      },
    },
  });

  return <AdminTopicsClient topics={topics} />;
}

