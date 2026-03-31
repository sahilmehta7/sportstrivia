
import { auth } from "@/lib/auth";
import { getPublicQuizFilterOptions, getPublicQuizList } from "@/lib/services/public-quiz.service";
import { QuizzesContent } from "@/app/quizzes/QuizzesContent";
import {
    parsePublicFilters,
    getFilterGroups,
    SearchParams,
} from "@/app/quizzes/quiz-utils";
import { ItemListStructuredData } from "@/components/seo/ItemListStructuredData";


export async function QuizListSection({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const filters = parsePublicFilters(searchParams);
    const session = await auth();
    const userId = session?.user?.id;

    // We fetch filter groups and quiz list in parallel
    const [listing, filterGroups, filterOptions] = await Promise.all([
        getPublicQuizList(filters, { telemetryUserId: userId }),
        getFilterGroups(searchParams),
        getPublicQuizFilterOptions(),
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
                difficultyOptions={filterOptions.difficulties}

                pagination={listing.pagination}
            />
            <ItemListStructuredData itemListElements={itemList} name="Sports Trivia Quizzes" />
        </>
    );
}

export function QuizListSectionSkeleton() {
    return (
        <div className="space-y-16">
            <div className="flex flex-col gap-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-foreground/5 pb-8">
                    <div className="space-y-4">
                        <div className="h-12 w-64 bg-muted/10 animate-pulse" />
                        <div className="h-6 w-96 bg-muted/10 animate-pulse" />
                    </div>
                </div>
                <div className="h-16 w-full border border-foreground/5 bg-muted/5 animate-pulse" />
                <div className="h-24 w-full border-y border-foreground/10 bg-muted/5 animate-pulse" />
            </div>
            
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-[16/10] bg-muted/5 border-2 border-foreground/5 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
