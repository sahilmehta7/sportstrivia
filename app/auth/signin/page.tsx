"use client";

import { signInWithGoogleAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

const SignInContent = () => {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/quizzes";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use theme if mounted, otherwise default to dark to prevent hydration mismatch
  const effectiveTheme = mounted && theme ? theme : "dark";
  const blur = getBlurCircles();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8">
      {/* Neon Arena Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
        <div className={cn("absolute -left-[10%] top-[10%] h-[50%] w-[50%] rounded-full blur-[120px] opacity-20", blur.circle1)} />
        <div className={cn("absolute -right-[5%] top-[5%] h-[40%] w-[40%] rounded-full blur-[100px] opacity-15", blur.circle2)} />
        <div className={cn("absolute -bottom-[10%] left-[30%] h-[35%] w-[35%] rounded-full blur-[90px] opacity-10", blur.circle3)} />
      </div>

      {/* Main signin card with Neon Arena glassmorphism */}
      <div className="relative z-10 w-full max-w-[480px]">
        <div className={cn(
          "overflow-hidden rounded-[3rem] border border-white/10 p-8 sm:p-12",
          "glass-elevated shadow-glass-lg"
        )}>
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-pulse-glow pointer-events-none" />

          {/* Icon container */}
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
              <div className="relative rounded-[2rem] glass-elevated border-white/20 p-6 shadow-neon-cyan/20">
                <Trophy className="h-12 w-12 text-primary" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-pulse" />
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-4 text-center mb-10">
            <h1 className={cn(
              "text-4xl font-black tracking-tighter sm:text-5xl leading-none",
              getGradientText("editorial")
            )}>
              ENTER THE <br /> ARENA
            </h1>
            <p className="text-base text-muted-foreground font-medium leading-relaxed">
              Join the elite circle of sports fans. Your legacy starts here.
            </p>
          </div>

          {/* Sign in button */}
          <form action={signInWithGoogleAction} className="space-y-6">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button
              type="submit"
              variant="accent"
              size="xl"
              className="w-full gap-3 font-black uppercase tracking-widest text-lg"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
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

            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-white/5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">SECURE REGISTRATION</span>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>

            <Button
              variant="glass"
              size="xl"
              asChild
              className="w-full gap-3 font-black uppercase tracking-widest text-lg"
            >
              <a href="/quizzes">
                Explore Guest Passes
                <ArrowRight className="h-6 w-6" />
              </a>
            </Button>
          </form>

          {/* Footer text */}
          <div className="mt-12 text-center space-y-2">
            <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
              By entering, you accept our
            </p>
            <div className="flex justify-center gap-4 text-[10px] font-black tracking-widest uppercase">
              <a href="/terms" className="text-primary hover:underline transition-all">Terms</a>
              <span className="text-white/10">•</span>
              <a href="/privacy" className="text-primary hover:underline transition-all">Privacy</a>
            </div>
          </div>
        </div>

        {/* Animated bottom bar */}
        <div className="mt-8 flex justify-center">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-neon-cyan" />
        </div>
      </div>
    </div>
  );
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full"></div></div>}>
      <SignInContent />
    </Suspense>
  );
}
