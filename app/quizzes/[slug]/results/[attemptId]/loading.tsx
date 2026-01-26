import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4 text-center">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Analyzing Results</h2>
        <p className="max-w-[250px] text-sm text-slate-500 dark:text-slate-400">
          Calculating your final score and performance metrics...
        </p>
      </div>
    </div>
  );
}

