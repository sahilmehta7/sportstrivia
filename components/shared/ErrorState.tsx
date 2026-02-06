"use client";

import { ShieldAlert, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getGradientText } from "@/lib/showcase-theme";

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
  title = "System Failure",
  message = "A critical synchronization error has occurred.",
  action = "RE-INITIALIZE",
  onRetry,
  showBackButton = true,
  backHref = "/",
  backLabel = "BASE COMMAND",
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex min-h-[60vh] flex-col items-center justify-center p-8 text-center space-y-10 items-center", className)}>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full" />
        <div className="relative h-24 w-24 rounded-[2.5rem] glass border border-red-500/20 flex items-center justify-center text-red-400 shadow-neon-magenta/10">
          <ShieldAlert className="h-12 w-12 animate-pulse" />
        </div>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <h3 className={cn("text-4xl font-black uppercase tracking-tighter", getGradientText("neon"))}>
          {title.toUpperCase()}
        </h3>
        <p className="text-sm font-black tracking-widest text-muted-foreground/60 uppercase leading-relaxed">
          {message.toUpperCase()}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {onRetry && (
          <Button onClick={onRetry} variant="accent" size="xl" className="w-full sm:w-auto rounded-2xl px-10 shadow-neon-magenta/20">
            <RefreshCw className="mr-3 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            {action.toUpperCase()}
          </Button>
        )}
        {showBackButton && (
          <Button asChild variant="glass" size="xl" className="w-full sm:w-auto rounded-2xl px-10 border-white/5">
            <Link href={backHref}>
              <Home className="mr-3 h-5 w-5" />
              {backLabel.toUpperCase()}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
