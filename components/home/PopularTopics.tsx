import { cn } from "@/lib/utils";
import { ShowcaseTopTopics } from "@/components/quiz/ShowcaseTopTopics";
import { getTopTopics } from "@/lib/services/home-page.service";
import { getGradientText } from "@/lib/showcase-theme";

export async function PopularTopics() {
  const topTopics = await getTopTopics();

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h2 className={cn("text-4xl font-black tracking-tighter sm:text-6xl mb-4", getGradientText("accent"))}>
            POPULAR REGIONS
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground font-medium">
            The most contested categories in the trivia universe.
          </p>
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
