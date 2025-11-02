import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: string;
  onRetry?: () => void;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  action = "Try again",
  onRetry,
  showBackButton = true,
  backHref = "/",
  backLabel = "Go home",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-6 p-4",
        className
      )}
    >
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-md w-full">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-destructive text-lg">{title}</h3>
            <p className="text-sm text-destructive/90">{message}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            {action}
          </Button>
        )}
        {showBackButton && (
          <Button asChild variant="outline">
            <Link href={backHref}>
              {backHref === "/" ? (
                <>
                  <Home className="mr-2 h-4 w-4" />
                  {backLabel}
                </>
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backLabel}
                </>
              )}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

