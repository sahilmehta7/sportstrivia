export function FeaturedQuizzesSkeleton() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 w-full max-w-5xl rounded-[1.75rem] border border-border/60 bg-card/40 p-8 backdrop-blur-xl">
          <div className="mx-auto h-6 w-48 rounded-full bg-muted" />
          <div className="mx-auto mt-4 h-4 w-80 rounded-full bg-muted" />
        </div>
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[360px] w-[300px] flex-shrink-0 rounded-[2.25rem] border border-border/60 bg-card/40" />
          ))}
        </div>
      </div>
    </section>
  );
}

