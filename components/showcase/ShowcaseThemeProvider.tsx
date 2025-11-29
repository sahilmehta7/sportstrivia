"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { useTheme as useNextTheme } from "next-themes";

export type ShowcaseTheme = "light" | "dark";

interface ShowcaseThemeContextType {
  theme: ShowcaseTheme;
  toggleTheme: () => void;
}

const ShowcaseThemeContext = createContext<ShowcaseThemeContextType | undefined>(undefined);

export function ShowcaseThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme, theme: userTheme, setTheme: setNextTheme } = useNextTheme();

  // Use resolvedTheme as source of truth - it handles "system" theme correctly
  const effectiveTheme: ShowcaseTheme = useMemo(() => {
    // resolvedTheme is the actual resolved theme (light/dark), handling "system" automatically
    // If it's undefined, fall back to userTheme, but default to "dark" for safety
    const current = resolvedTheme ?? userTheme;
    return current === "light" ? "light" : "dark";
  }, [resolvedTheme, userTheme]);

  // Sync DOM class with resolved theme to ensure consistency
  useEffect(() => {
    if (typeof window === "undefined" || !resolvedTheme) return;

    const classList = document.documentElement.classList;
    const shouldBeDark = resolvedTheme === "dark";
    const hasDark = classList.contains("dark");
    const hasLight = classList.contains("light");

    // Only update if there's a mismatch
    if (shouldBeDark && !hasDark) {
      classList.remove("light");
      classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else if (!shouldBeDark && !hasLight) {
      classList.remove("dark");
      classList.add("light");
      document.documentElement.style.colorScheme = "light";
    }
  }, [resolvedTheme]);

  const toggleTheme = () => {
    const next = effectiveTheme === "light" ? "dark" : "light";
    setNextTheme(next);
  };

  return (
    <ShowcaseThemeContext.Provider value={{ theme: effectiveTheme, toggleTheme }}>
      {children}
    </ShowcaseThemeContext.Provider>
  );
}

export function useShowcaseTheme() {
  const context = useContext(ShowcaseThemeContext);
  if (context === undefined) {
    throw new Error("useShowcaseTheme must be used within a ShowcaseThemeProvider");
  }
  return context;
}
