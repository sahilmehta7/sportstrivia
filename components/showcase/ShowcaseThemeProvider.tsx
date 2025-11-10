"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

export type ShowcaseTheme = "light" | "dark";

interface ShowcaseThemeContextType {
  theme: ShowcaseTheme;
  toggleTheme: () => void;
}

const ShowcaseThemeContext = createContext<ShowcaseThemeContextType | undefined>(undefined);

export function ShowcaseThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, theme: userTheme, setTheme: setNextTheme } = useNextTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTheme: ShowcaseTheme = useMemo(() => {
    if (!mounted) {
      return "dark";
    }

    const current = (resolvedTheme ?? userTheme) === "light" ? "light" : "dark";
    return current;
  }, [mounted, resolvedTheme, userTheme]);

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
