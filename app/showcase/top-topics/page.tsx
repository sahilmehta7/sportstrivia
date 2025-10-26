import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { ShowcaseTopTopics } from "@/components/quiz/ShowcaseTopTopics";

export default function TopTopicsShowcasePage() {
  return (
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Top Quiz Topics"
        subtitle="Reusable widget showcasing the most popular quiz topics with customizable sorting and glassmorphism design"
        badge="TOPICS WIDGET SHOWCASE"
        variant="default"
      >
        <div className="space-y-12">
          {/* Default Configuration */}
          <section className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Default Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Shows top 6 topics sorted by most active users in the last 30 days
              </p>
            </div>
            <ShowcaseTopTopics />
          </section>

          {/* Custom Configuration - Most Quizzes */}
          <section className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Sorted by Quiz Count</h3>
              <p className="text-sm text-muted-foreground">
                Shows topics with the most quizzes available
              </p>
            </div>
            <ShowcaseTopTopics
              title="Topics with Most Quizzes"
              defaultSortBy="quizzes"
              limit={6}
            />
          </section>

          {/* Custom Configuration - Limited Results */}
          <section className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Top 3 Categories</h3>
              <p className="text-sm text-muted-foreground">
                Limited to top 3 topics with custom title
              </p>
            </div>
            <ShowcaseTopTopics
              title="Top 3 Categories"
              defaultSortBy="users"
              limit={3}
              showViewAll={false}
            />
          </section>

          {/* Custom Configuration - Different Title */}
          <section className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Custom Title & Link</h3>
              <p className="text-sm text-muted-foreground">
                Custom title and view all link
              </p>
            </div>
            <ShowcaseTopTopics
              title="Popular Learning Categories"
              viewAllHref="/topics"
              defaultSortBy="users"
              limit={6}
            />
          </section>
        </div>
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
