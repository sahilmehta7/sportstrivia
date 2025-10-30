"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

export type ShowcaseTheme = "light" | "dark";

interface ShowcaseThemeContextType {
  theme: ShowcaseTheme;
  toggleTheme: () => void;
}

const ShowcaseThemeContext = createContext<ShowcaseThemeContextType | undefined>(undefined);

export function ShowcaseThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ShowcaseTheme>("dark");
  const { theme: nextTheme, setTheme: setNextTheme } = useNextTheme();

  // Mirror next-themes into showcase theme to keep the whole home page in sync
  useEffect(() => {
    const mapped = nextTheme === "light" ? "light" : "dark";
    setTheme(mapped);
  }, [nextTheme]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    setNextTheme(next);
  };

  return (
    <ShowcaseThemeContext.Provider value={{ theme, toggleTheme }}>
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
