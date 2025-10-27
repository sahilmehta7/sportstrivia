import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="rounded-3xl bg-white/10 px-10 py-12 text-center shadow-lg backdrop-blur">
        <p className="text-sm uppercase tracking-[0.4em] text-white/60">Error 404</p>
        <h1 className="mt-4 text-4xl font-black">Page not found</h1>
        <p className="mt-3 max-w-sm text-sm text-white/70">
          The page you were looking for has been benched. Try exploring the latest quizzes instead.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="rounded-full bg-white px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900">
            Back Home
          </Link>
          <Link href="/quizzes" className="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white">
            Browse Quizzes
          </Link>
        </div>
      </div>
    </div>
  );
}
