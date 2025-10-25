"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useShowcaseTheme } from "./ShowcaseThemeProvider";
import { getBackgroundVariant, getBlurCircles, getTextColor, type BackgroundVariant } from "@/lib/showcase-theme";

interface ShowcaseLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  variant?: BackgroundVariant;
}

export function ShowcaseLayout({ 
  children, 
  title, 
  subtitle, 
  badge, 
  variant = "default" 
}: ShowcaseLayoutProps) {
  const { theme, toggleTheme } = useShowcaseTheme();
  const blurCircles = getBlurCircles(theme);

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden ${getBackgroundVariant(variant, theme)} px-4 py-12 sm:px-6 lg:py-16`}>
      {/* Animated blur circles */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className={`absolute -left-20 top-24 h-72 w-72 rounded-full ${blurCircles.circle1} blur-[120px]`} />
        <div className={`absolute right-12 top-12 h-64 w-64 rounded-full ${blurCircles.circle2} blur-[100px]`} />
        <div className={`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full ${blurCircles.circle3} blur-[90px]`} />
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          {badge && (
            <div className={`inline-flex items-center gap-2 rounded-full border ${theme === "light" ? "border-slate-200/50 bg-slate-100/80" : "border-white/20 bg-white/10"} px-4 py-1 text-xs uppercase tracking-[0.35em] ${getTextColor(theme, "muted")} mb-6`}>
              {badge}
            </div>
          )}
          
          <h1 className={`text-4xl font-black uppercase tracking-tight ${getTextColor(theme, "primary")} drop-shadow-[0_16px_32px_rgba(32,32,48,0.35)] sm:text-5xl lg:text-6xl mb-4`}>
            {title}
            {theme === "light" && <span className="text-blue-600"> Showcase</span>}
            {theme === "dark" && <span className="text-emerald-300"> Showcase</span>}
          </h1>
          
          {subtitle && (
            <p className={`mx-auto max-w-2xl text-sm ${getTextColor(theme, "secondary")} mb-4`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-center mb-8">
          <Button 
            onClick={toggleTheme}
            variant="outline"
            className="gap-2"
          >
            {theme === "dark" ? "☀️" : "🌙"} Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </Button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
