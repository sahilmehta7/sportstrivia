"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseFilterDrawerProps {
  children: ReactNode;
  triggerLabel?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function ShowcaseFilterDrawer({
  children,
  triggerLabel = "Filters",
  title = "Filter Quizzes",
  description = "Refine the catalog to match your interests",
  className,
}: ShowcaseFilterDrawerProps) {
  const { theme } = useShowcaseTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full">
            <Filter className="mr-2 h-4 w-4" /> {triggerLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg rounded-[2rem] border border-white/15 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-bold", getTextColor(theme, "primary"))}>{title}</DialogTitle>
            <DialogDescription className={cn("text-sm", getTextColor(theme, "secondary"))}>
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className={cn("mt-4 space-y-4 rounded-[1.5rem] p-4", getSurfaceStyles(theme, "sunken"))}>
            {children}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)} className="rounded-full">
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
