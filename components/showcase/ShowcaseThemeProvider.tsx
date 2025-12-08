"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useTheme as useNextTheme } from "next-themes";

export type ShowcaseTheme = "light" | "dark";

interface ShowcaseThemeContextType {
  theme: ShowcaseTheme;
  toggleTheme: () => void;
}

const ShowcaseThemeContext = createContext<ShowcaseThemeContextType | undefined>(undefined);

export function ShowcaseThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme: setNextTheme } = useNextTheme();

  const theme: ShowcaseTheme = (resolvedTheme === "light" || resolvedTheme === "dark")
    ? resolvedTheme
    : "dark";

  const toggleTheme = () => {
    setNextTheme(theme === "light" ? "dark" : "light");
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
