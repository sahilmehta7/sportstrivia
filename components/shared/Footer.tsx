export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Sports Trivia</p>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            Stay sharp with daily challenges, track your stats, and compete on the global leaderboard.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-slate-400 sm:text-right">
          <span>Have feedback?</span>
          <a
            className="font-medium text-white transition hover:text-indigo-300"
            href="mailto:support@sportstrivia.com"
          >
            support@sportstrivia.com
          </a>
          <span className="text-xs text-slate-500">© {currentYear} Sports Trivia. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
