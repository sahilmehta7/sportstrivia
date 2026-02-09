
import { auth } from "@/lib/auth";
import { getPublicQuizList } from "@/lib/services/public-quiz.service";
import { QuizzesContent } from "@/app/quizzes/QuizzesContent";
import { parsePublicFilters, getFilterGroups, SearchParams } from "@/app/quizzes/quiz-utils";
import { ItemListStructuredData } from "@/components/seo/ItemListStructuredData";
import { QuizListSkeleton } from "@/components/shared/skeletons";

export async function QuizListSection({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const filters = parsePublicFilters(searchParams);
    const session = await auth();
    const userId = session?.user?.id;

    // We fetch filter groups and quiz list in parallel
    const [listing, filterGroups] = await Promise.all([
        getPublicQuizList(filters, { telemetryUserId: userId }),
        getFilterGroups(searchParams),
    ]);

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

    const itemList = listing.quizzes.map((quiz, index) => ({
        position: (listing.pagination.page - 1) * listing.pagination.limit + index + 1,
        url: baseUrl ? `${baseUrl}/quizzes/${quiz.slug}` : `/quizzes/${quiz.slug}`,
        name: quiz.title,
        ...(quiz.descriptionImageUrl ? { image: quiz.descriptionImageUrl } : {}),
        ...(quiz.description ? { description: quiz.description } : {}),
    }));

    return (
        <>
            <QuizzesContent
                quizzes={listing.quizzes}
                filterGroups={filterGroups}
                pagination={listing.pagination}
            />
            <ItemListStructuredData itemListElements={itemList} name="Sports Trivia Quizzes" />
        </>
    );
}

export function QuizListSectionSkeleton() {
    return (
        <div className="space-y-12 pt-8">
            <div className="h-10 w-full max-w-2xl bg-muted/5 rounded animate-pulse" />
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-[320px] bg-muted/5 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    );
}
