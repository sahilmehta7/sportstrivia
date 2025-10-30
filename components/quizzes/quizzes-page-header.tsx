"use client";

export function QuizzesPageHeader() {
  return (
    <div className="mb-8 space-y-4 text-center lg:text-left">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Discover Sports Quizzes
        </h1>
        <p className="text-lg text-muted-foreground">
          Test your knowledge with curated trivia challenges.
        </p>
      </div>
      <p className="text-sm text-muted-foreground lg:max-w-2xl">
        Browse featured trivia, filter by sport or difficulty, and track your progress across the
        biggest moments in sports. Use the search in the navigation bar to jump straight to the
        quizzes you care about.
      </p>
    </div>
  );
}
