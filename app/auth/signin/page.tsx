"use client";

import { signInWithGoogleAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { getBlurCircles, getGlassCard } from "@/lib/showcase-theme";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use theme if mounted, otherwise default to dark to prevent hydration mismatch
  const effectiveTheme = mounted && theme ? theme : "dark";
  const blur = getBlurCircles(effectiveTheme);
  const backgroundVariant = effectiveTheme === "light"
    ? "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80"
    : "bg-slate-950";

  return (
    <div className={cn("relative flex min-h-screen items-center justify-center overflow-hidden p-4", backgroundVariant)}>
      {/* Animated blur circles - matching showcase pattern */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className={cn("absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]", blur.circle1)} />
        <div className={cn("absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]", blur.circle2)} />
        <div className={cn("absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]", blur.circle3)} />
      </div>

      {/* Main signin card with glassmorphism */}
      <div className="relative z-10 w-full max-w-md">
        <div className={cn(
          "rounded-[2rem] border p-6 sm:p-8 md:p-10",
          "backdrop-blur-2xl shadow-2xl",
          getGlassCard(effectiveTheme),
          effectiveTheme === "light"
            ? "shadow-[0_40px_120px_-40px_rgba(59,130,246,0.25)]"
            : "shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]"
        )}>
          {/* Icon container */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className={cn(
              "relative rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300",
              "backdrop-blur-sm",
              effectiveTheme === "light"
                ? "bg-white/60 border border-slate-200/50 shadow-[0_16px_40px_-24px_rgba(59,130,246,0.3)]"
                : "bg-white/10 border border-white/20 shadow-[0_16px_40px_-24px_rgba(34,197,94,0.4)]"
            )}>
              <Trophy className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 transition-colors",
                effectiveTheme === "light" ? "text-blue-600" : "text-emerald-300"
              )} />
              
              {/* Decorative sparkle */}
              <Sparkles className={cn(
                "absolute -top-1 -right-1 h-5 w-5 animate-pulse",
                effectiveTheme === "light" ? "text-blue-400/70" : "text-emerald-400/70"
              )} />
            </div>
          </div>

          {/* Title */}
          <h1 className={cn(
            "mb-3 text-center text-2xl sm:text-3xl font-bold",
            effectiveTheme === "light" ? "text-slate-900" : "text-white"
          )}>
            Welcome to Sports Trivia
          </h1>

          {/* Subtitle */}
          <p className={cn(
            "mb-6 sm:mb-8 text-center text-sm sm:text-base",
            effectiveTheme === "light" ? "text-slate-600" : "text-white/70"
          )}>
            Test your sports knowledge and compete with friends
          </p>

          {/* Sign in button */}
          <form action={signInWithGoogleAction}>
            <Button 
              type="submit" 
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl",
                "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                "shadow-lg",
                effectiveTheme === "light"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-[0_12px_32px_-16px_rgba(59,130,246,0.5)]"
                  : "bg-blue-500 hover:bg-blue-400 shadow-[0_12px_32px_-16px_rgba(59,130,246,0.4)]"
              )}
              size="lg"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          {/* Footer text */}
          <p className={cn(
            "mt-6 text-center text-xs sm:text-sm",
            effectiveTheme === "light" ? "text-slate-500" : "text-white/50"
          )}>
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:opacity-70 transition-opacity">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:opacity-70 transition-opacity">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

