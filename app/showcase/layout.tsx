"use client";

import type { ReactNode } from "react";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";

export default function ShowcaseLayout({ children }: { children: ReactNode }) {
  return <ShowcaseThemeProvider>{children}</ShowcaseThemeProvider>;
}
