import { getPublicQuizList } from "@/lib/services/public-quiz.service";
import { FeaturedCardHero } from "@/components/showcase/cards/FeaturedCardHero";
import { FeaturedCardCompact } from "@/components/showcase/cards/FeaturedCardCompact";
import { FeaturedCardModern } from "@/components/showcase/cards/FeaturedCardModern";
import { FeaturedCardMinimal } from "@/components/showcase/cards/FeaturedCardMinimal";
import { FeaturedCardTrading } from "@/components/showcase/cards/FeaturedCardTrading";

export const dynamic = 'force-dynamic';

export default async function FeaturedCardShowcasePage() {
    const { quizzes } = await getPublicQuizList({ limit: 5 });
    const quiz = quizzes[0]; // Use the first quiz for all cards for consistency, or map them differently

    if (!quiz) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-xl font-bold">No quizzes found. Please seed the database.</p>
            </div>
        )
    }

    // We can cycle through quizzes for variety if available, otherwise reuse the first one
    const quiz1 = quizzes[0];
    const quiz2 = quizzes[1] || quizzes[0];
    const quiz3 = quizzes[2] || quizzes[0];
    const quiz4 = quizzes[3] || quizzes[0];
    const quiz5 = quizzes[4] || quizzes[0];


    return (
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900 md:p-12">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white md:text-5xl">
                        Featured Card <span className="text-primary">Styles</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                        Real data integration. Mobile-first, sports-themed.
                    </p>
                </div>

                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
                    {/* Design 1: Hero */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white dark:bg-white dark:text-black">1</span>
                            <h2 className="text-xl font-bold">Hero / Default</h2>
                        </div>
                        <p className="text-sm text-gray-500">High impact, large imagery, ideal for the main featured item.</p>
                        <FeaturedCardHero quiz={quiz1} />
                    </div>

                    {/* Design 2: Compact */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white dark:bg-white dark:text-black">2</span>
                            <h2 className="text-xl font-bold">Compact Row</h2>
                        </div>
                        <p className="text-sm text-gray-500">Space-efficient, good for lists or secondary features.</p>
                        <FeaturedCardCompact quiz={quiz2} />
                    </div>

                    {/* Design 3: Modern */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white dark:bg-white dark:text-black">3</span>
                            <h2 className="text-xl font-bold">Modern Gradient</h2>
                        </div>
                        <p className="text-sm text-gray-500">Trendy, vibrant, uses overlay effects.</p>
                        <FeaturedCardModern quiz={quiz3} />
                    </div>

                    {/* Design 4: Minimal */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white dark:bg-white dark:text-black">4</span>
                            <h2 className="text-xl font-bold">Brutalist / Minimal</h2>
                        </div>
                        <p className="text-sm text-gray-500">Clean, information-dense, high contrast.</p>
                        <FeaturedCardMinimal quiz={quiz4} />
                    </div>

                    {/* Design 5: Trading Card */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white dark:bg-white dark:text-black">5</span>
                            <h2 className="text-xl font-bold">Trading Card</h2>
                        </div>
                        <p className="text-sm text-gray-500">Gamified look, stats focus, collectible feel.</p>
                        <FeaturedCardTrading quiz={quiz5} />
                    </div>
                </div>
            </div>
        </div>
    );
}
