"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

type ShowcaseTheme = "light" | "dark";

interface ShowcaseThemeContextType {
  theme: ShowcaseTheme;
  toggleTheme: () => void;
}

const ShowcaseThemeContext = createContext<ShowcaseThemeContextType | undefined>(undefined);

export function ShowcaseThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ShowcaseTheme>("dark");

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("showcase-theme") as ShowcaseTheme;
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem("showcase-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
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
