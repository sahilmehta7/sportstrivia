import { Metadata } from "next";
import { ShowcaseQuizResults } from "@/components/quiz/ShowcaseQuizResults";

export const metadata: Metadata = {
  title: "Quiz Results Showcase",
  description: "Showcase of quiz results page with light and dark mode support",
};

export default function QuizResultsShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Quiz Results Showcase</h1>
          <p className="text-muted-foreground">
            Interactive showcase of quiz results page with light and dark mode support
          </p>
        </div>

        <ShowcaseQuizResults />
      </div>
    </div>
  );
}
