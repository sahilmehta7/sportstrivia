import { cn } from "@/lib/utils";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { ShowcaseTopTopics } from "@/components/quiz/ShowcaseTopTopics";
import { getTopTopics } from "@/lib/services/home-page.service";

export async function PopularTopics() {
  const topTopics = await getTopTopics();

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div
          className={cn(
            "relative mx-auto mb-8 w-full max-w-5xl rounded-[1.75rem] border p-6 sm:p-8 backdrop-blur-xl",
            getGlassCard()
          )}
        >
          <div className="text-center">
            <h2
              className={cn(
                "mb-4 text-2xl font-bold sm:text-3xl",
                getTextColor("primary")
              )}
            >
              Popular Topics
            </h2>
            <p
              className={cn(
                "text-base sm:text-lg",
                getTextColor("secondary")
              )}
            >
              Explore the most popular sports categories
            </p>
          </div>
        </div>

        <ShowcaseTopTopics
          title=""
          showViewAll={false}
          defaultSortBy="users"
          limit={6}
          initialTopics={topTopics}
        />
      </div>
    </section>
  );
}
