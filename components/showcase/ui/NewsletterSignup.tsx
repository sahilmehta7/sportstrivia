"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getInputStyles } from "@/lib/showcase-theme";

interface ShowcaseNewsletterSignupProps {
  title?: string;
  description?: string;
  onSubmit?: (email: string) => void;
  className?: string;
}

export function ShowcaseNewsletterSignup({
  title = "Stay in the loop",
  description = "Weekly drops of trivia packs, creator tips, and leaderboards",
  onSubmit,
  className,
}: ShowcaseNewsletterSignupProps) {
  const { theme } = useShowcaseTheme();
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(email);
    setEmail("");
  };

  return (
    <div className={cn("rounded-[2.5rem] px-6 py-8", getSurfaceStyles(theme, "raised"), className)}>
      <h3 className={cn("text-2xl font-black", getTextColor(theme, "primary"))}>{title}</h3>
      <p className={cn("mt-2 text-sm", getTextColor(theme, "secondary"))}>{description}</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={cn("h-11 rounded-full px-5", getInputStyles(theme))}
        />
        <Button type="submit" className="rounded-full uppercase tracking-[0.3em]">
          Subscribe
        </Button>
      </form>
    </div>
  );
}
