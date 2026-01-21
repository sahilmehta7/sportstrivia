"use client";

import Link from "next/link";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  const { circle1, circle2, circle3 } = getBlurCircles();

  return (
    <ShowcaseThemeProvider>
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 -z-10">{circle1}{circle2}{circle3}</div>

        <div className="relative max-w-xl w-full group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity rounded-[3.5rem]" />

          <div className="relative overflow-hidden rounded-[3.5rem] glass-elevated border border-white/10 p-12 sm:p-16 text-center space-y-10 shadow-2xl">
            <div className="space-y-6">
              <div className="h-24 w-24 mx-auto rounded-[2.5rem] glass border border-white/10 flex items-center justify-center text-primary shadow-neon-cyan/20 animate-pulse">
                <ShieldAlert className="h-12 w-12" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40">SECTOR NOT FOUND • 404</p>
                <h1 className={cn("text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-[0.85]", getGradientText("neon"))}>
                  ARENA <br /> DE-SYNC
                </h1>
              </div>
              <p className="text-sm font-bold tracking-widest text-muted-foreground/60 uppercase leading-relaxed">
                THE TARGETED COORDINATES DO NOT RESOLVE TO AN ACTIVE SECTOR. THE DATA PACK HAS BEEN BENCHED.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild variant="neon" size="xl" className="w-full sm:w-auto rounded-2xl px-10">
                <Link href="/">
                  <Home className="mr-3 h-5 w-5" />
                  RETURN BASE
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl" className="w-full sm:w-auto rounded-2xl px-10 border-white/5">
                <Link href="/quizzes">
                  <Search className="mr-3 h-5 w-5" />
                  SCAN ARENAS
                </Link>
              </Button>
            </div>
          </div>

          {/* Visual accent */}
          <div className="absolute bottom-4 right-4 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      </div>
    </ShowcaseThemeProvider>
  );
}
