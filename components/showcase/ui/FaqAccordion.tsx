"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

export interface FaqItem {
  question: string;
  answer: string;
}

interface ShowcaseFaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

export function ShowcaseFaqAccordion({ items, className }: ShowcaseFaqAccordionProps) {
  const { theme } = useShowcaseTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("rounded-[2rem] p-6", getSurfaceStyles(theme, "base"), className)}>
      <div className="space-y-3">
        {items.map((item, index) => {
          const open = index === openIndex;
          return (
            <div key={item.question} className={cn("rounded-[1.5rem] px-4 py-3", getSurfaceStyles(theme, open ? "raised" : "sunken"))}>
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              >
                <span className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>{item.question}</span>
                <span className="text-xl" aria-hidden="true">
                  {open ? "−" : "+"}
                </span>
              </button>
              {open && <p className={cn("mt-2 text-sm", getTextColor(theme, "secondary"))}>{item.answer}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
