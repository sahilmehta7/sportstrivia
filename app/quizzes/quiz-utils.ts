import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getTodaysGame } from "@/lib/services/daily-game.service";
import { getMaxGuesses, getGameTypeDisplayName, getISTDateString, DailyGameType } from "@/lib/utils/daily-game-logic";
import type { PublicQuizFilters } from "@/lib/dto/quiz-filters.dto";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import { Difficulty } from "@prisma/client";

export const DEFAULT_PAGE_SIZE = 12;

const sportEmojiMap: Record<string, string> = {
    Cricket: "🏏",
    Football: "⚽",
    Basketball: "🏀",
    Tennis: "🎾",
    "Formula 1": "🏎️",
    Olympics: "🏅",
    Rugby: "🏉",
    Golf: "⛳",
    Baseball: "⚾",
    Hockey: "🏒",
};

export type SearchParams = {
    [key: string]: string | string[] | undefined;
};

export interface DailyGameData {
    gameId: string;
    gameType: DailyGameType;
    displayName: string;
    gameNumber: number;
    isCompleted: boolean;
    solved?: boolean;
    guessCount?: number;
    maxGuesses: number;
}

// Helper to get daily game data for the hero
export async function getDailyGameData(userId?: string): Promise<DailyGameData | null> {
    try {
        const game = await getTodaysGame(userId);
        if (!game) return null;

        const maxGuesses = getMaxGuesses(game.gameType);
        const isCompleted = !!(game.userAttempt?.solved ||
            (game.userAttempt?.guessCount ?? 0) >= maxGuesses);

        // Calculate game number
        const startDate = new Date('2026-01-26');
        const today = new Date(getISTDateString());
        const gameNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return {
            gameId: game.id,
            gameType: game.gameType,
            displayName: getGameTypeDisplayName(game.gameType),
            gameNumber,
            isCompleted,
            solved: game.userAttempt?.solved ?? undefined,
            guessCount: game.userAttempt?.guessCount ?? undefined,
            maxGuesses,
        };
    } catch (error) {
        console.error("Error fetching daily game data:", error);
        return null;
    }
}

export function getParamValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value ?? undefined;
}

export function parsePublicFilters(searchParams: SearchParams): PublicQuizFilters {
    const pageParam = getParamValue(searchParams.page);
    const limitParam = getParamValue(searchParams.limit);
    const minDurationParam = getParamValue(searchParams.minDuration);
    const maxDurationParam = getParamValue(searchParams.maxDuration);
    const minRatingParam = getParamValue(searchParams.minRating);

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const limitValue = limitParam
        ? Math.max(1, parseInt(limitParam, 10) || DEFAULT_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const limit = Math.min(limitValue, 50);

    const difficultyValue = getParamValue(searchParams.difficulty);
    const difficultyParam =
        difficultyValue && Object.values(Difficulty).includes(difficultyValue as Difficulty)
            ? (difficultyValue as Difficulty)
            : undefined;

    const sortByValue = getParamValue(searchParams.sortBy);
    const sortByParam =
        sortByValue && ["popularity", "rating", "createdAt"].includes(sortByValue)
            ? (sortByValue as "popularity" | "rating" | "createdAt")
            : "createdAt";

    const sortOrderValue = getParamValue(searchParams.sortOrder);
    const sortOrderParam = sortOrderValue === "asc" || sortOrderValue === "desc" ? sortOrderValue : "desc";

    return {
        page,
        limit,
        search: getParamValue(searchParams.search),
        sport: getParamValue(searchParams.sport),
        difficulty: difficultyParam,
        tag: getParamValue(searchParams.tag),
        topic: getParamValue(searchParams.topic),
        minDuration: minDurationParam ? parseInt(minDurationParam, 10) * 60 : undefined,
        maxDuration: maxDurationParam ? parseInt(maxDurationParam, 10) * 60 : undefined,
        minRating:
            minRatingParam && !Number.isNaN(parseFloat(minRatingParam))
                ? parseFloat(minRatingParam)
                : undefined,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
    };
}

export const loadTopicsWithQuizCounts = unstable_cache(
    async () => {
        // Fetch level 0 topics and their descendants (just IDs to keep it light)
        const rootTopics = await prisma.topic.findMany({
            where: { parentId: null },
            select: {
                id: true,
                name: true,
                slug: true,
                quizTopicConfigs: {
                    select: { quizId: true },
                    where: {
                        quiz: { isPublished: true, status: "PUBLISHED" },
                    },
                },
                children: {
                    select: {
                        id: true,
                        quizTopicConfigs: {
                            select: { quizId: true },
                            where: {
                                quiz: { isPublished: true, status: "PUBLISHED" },
                            },
                        },
                        children: {
                            select: {
                                id: true,
                                quizTopicConfigs: {
                                    select: { quizId: true },
                                    where: {
                                        quiz: { isPublished: true, status: "PUBLISHED" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return rootTopics
            .map((topic) => {
                const quizIds = new Set<string>();

                // Level 0
                topic.quizTopicConfigs.forEach((c) => quizIds.add(c.quizId));

                // Level 1
                topic.children.forEach((child) => {
                    child.quizTopicConfigs.forEach((c) => quizIds.add(c.quizId));

                    // Level 2
                    child.children.forEach((grandchild) => {
                        grandchild.quizTopicConfigs.forEach((c) => quizIds.add(c.quizId));
                    });
                });

                return {
                    id: topic.id,
                    name: topic.name,
                    slug: topic.slug,
                    quizCount: quizIds.size,
                };
            })
            .filter((topic) => topic.quizCount > 0)
            .sort((a, b) => b.quizCount - a.quizCount);
    },
    ["quizzes-page-topics-with-counts"],
    {
        revalidate: 3600, // Cache for 1 hour
        tags: ["topics", "quizzes"],
    }
);

export async function getFilterGroups(searchParams: SearchParams): Promise<ShowcaseFilterGroup[]> {
    const topicsWithCounts = await loadTopicsWithQuizCounts();
    const topicParam = getParamValue(searchParams.topic);

    const categoryOptions = [
        { value: "all", label: "All Sports" },
        ...topicsWithCounts
            .filter((topic) => Object.keys(sportEmojiMap).includes(topic.name))
            .map((topic) => ({
                value: topic.slug,
                label: topic.name,
                emoji: sportEmojiMap[topic.name] || "🏆",
                count: topic.quizCount,
            })),
    ];

    return [
        {
            id: "category",
            label: "Category",
            options: categoryOptions,
            activeValue: topicParam || "all",
        },
    ];
}
