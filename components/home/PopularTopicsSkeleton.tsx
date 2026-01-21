export function PopularTopicsSkeleton() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-12">
          <div className="h-12 w-64 rounded-xl bg-muted/40" />
          <div className="mt-4 h-6 w-96 rounded-lg bg-muted/20" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-48 rounded-[2rem] border border-white/5 bg-white/5" />
          ))}
        </div>
      </div>
    </section>
  );
}
