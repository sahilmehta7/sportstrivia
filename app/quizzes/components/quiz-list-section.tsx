
import { auth } from "@/lib/auth";
import { getPublicQuizList } from "@/lib/services/public-quiz.service";
import { QuizzesContent } from "@/app/quizzes/QuizzesContent";
import {
    SearchParams,
} from "@/app/quizzes/quiz-utils";
import { ItemListStructuredData } from "@/components/seo/ItemListStructuredData";

async function getAllPublishedQuizzes(userId?: string) {
    const firstPage = await getPublicQuizList(
        {
            page: 1,
            limit: 50,
            sortBy: "createdAt",
            sortOrder: "desc",
        },
        { telemetryUserId: userId, telemetryEnabled: false }
    );

    if (firstPage.pagination.pages <= 1) {
        return firstPage.quizzes;
    }

    const restPages = await Promise.all(
        Array.from({ length: firstPage.pagination.pages - 1 }, (_, index) =>
            getPublicQuizList(
                {
                    page: index + 2,
                    limit: 50,
                    sortBy: "createdAt",
                    sortOrder: "desc",
                },
                { telemetryUserId: userId, telemetryEnabled: false }
            )
        )
    );

    return [
        ...firstPage.quizzes,
        ...restPages.flatMap((pageResult) => pageResult.quizzes),
    ];
}

export async function QuizListSection({
    searchParams: _searchParams,
}: {
    searchParams: SearchParams;
}) {
    const session = await auth();
    const userId = session?.user?.id;
    const quizzes = await getAllPublishedQuizzes(userId);


    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

    const itemList = quizzes.map((quiz, index) => ({
        position: index + 1,
        url: baseUrl ? `${baseUrl}/quizzes/${quiz.slug}` : `/quizzes/${quiz.slug}`,
        name: quiz.title,
        ...(quiz.descriptionImageUrl ? { image: quiz.descriptionImageUrl } : {}),
        ...(quiz.description ? { description: quiz.description } : {}),
    }));

    return (
        <>
            <QuizzesContent
                quizzes={quizzes}
            />
            <ItemListStructuredData itemListElements={itemList} name="Sports Trivia Quizzes" />
        </>
    );
}

export function QuizListSectionSkeleton() {
    return (
        <div className="space-y-16">
            <div className="flex flex-col gap-12">
                <div className="flex flex-col gap-8 border-b-2 border-foreground/5 pb-8">
                    <div className="space-y-4">
                        <div className="h-12 w-64 bg-muted/10 animate-pulse" />
                        <div className="h-6 w-96 bg-muted/10 animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <div className="h-8 w-40 bg-muted/10 animate-pulse" />
                        <div className="flex gap-5 overflow-hidden">
                            {Array.from({ length: 3 }).map((__, j) => (
                                <div key={`${i}-${j}`} className="h-[280px] w-[280px] shrink-0 bg-muted/5 border-2 border-foreground/5 animate-pulse" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
