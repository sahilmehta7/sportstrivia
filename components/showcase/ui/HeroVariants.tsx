"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getGlassBackground,
  getGlassCard,
  getSurfaceStyles,
  getTextColor,
} from "@/lib/showcase-theme";

type HeroAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
};

function ActionButton({ action }: { action: HeroAction }) {
  if (!action?.label) return null;

  const { label, href, onClick, variant = "primary", icon } = action;

  const variantProps = (() => {
    switch (variant) {
      case "secondary":
        return { variant: "outline" as const };
      case "ghost":
        return { variant: "ghost" as const };
      default:
        return {};
    }
  })();

  if (href) {
    return (
      <Button
        {...variantProps}
        asChild
        className="gap-2"
        onClick={onClick}
      >
        <Link href={href}>
          {icon}
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      {...variantProps}
      className="gap-2"
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </Button>
  );
}

interface ShowcaseHeroSpotlightProps {
  eyebrow?: string;
  title: string;
  highlightedText?: string;
  subtitle?: string;
  backgroundImageUrl?: string | null;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  stats?: Array<{ label: string; value: string | number }>;
  className?: string;
}

export function ShowcaseHeroSpotlight({
  eyebrow,
  title,
  highlightedText,
  subtitle,
  backgroundImageUrl,
  primaryAction,
  secondaryAction,
  stats,
  className,
}: ShowcaseHeroSpotlightProps) {
  // Theme styling via CSS

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border px-8 py-12 shadow-xl sm:px-10 lg:px-16 lg:py-16",
        getSurfaceStyles("raised"),
        className
      )}
    >
      {backgroundImageUrl && (
        <div className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImageUrl}
            alt="Hero background"
            className="h-full w-full object-cover opacity-20"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent" />
        </div>
      )}

      <div className="relative flex flex-col gap-10">
        <div className="space-y-4 text-center lg:text-left">
          {eyebrow && (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]",
                "bg-white/80 text-slate-600",
                "dark:bg-white/15 dark:text-white/70"
              )}
            >
              {eyebrow}
            </span>
          )}
          <h1
            className={cn(
              "mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl",
              getTextColor("primary")
            )}
          >
            {title}{" "}
            {highlightedText && (
              <span
                className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  "from-blue-600 via-indigo-500 to-purple-600",
                  "dark:from-emerald-300 dark:via-sky-300 dark:to-blue-300"
                )}
              >
                {highlightedText}
              </span>
            )}
          </h1>
          {subtitle && (
            <p
              className={cn(
                "mx-auto max-w-3xl text-base sm:text-lg",
                getTextColor("secondary")
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
          {primaryAction && <ActionButton action={primaryAction} />}
          {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: secondaryAction.variant ?? "secondary" }} />}
        </div>

        {stats && stats.length > 0 && (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl px-6 py-5 text-center",
                  getGlassCard()
                )}
              >
                <dt className={cn("text-xs font-semibold uppercase tracking-[0.35em]", getTextColor("muted"))}>
                  {stat.label}
                </dt>
                <dd className={cn("mt-2 text-2xl font-bold", getTextColor("primary"))}>
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString()
                    : stat.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

interface ShowcaseHeroSplitProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  highlights?: Array<{ title: string; description?: string; icon?: ReactNode }>;
  media?: ReactNode;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  className?: string;
}

export function ShowcaseHeroSplit({
  eyebrow,
  title,
  subtitle,
  highlights,
  media,
  primaryAction,
  secondaryAction,
  className,
}: ShowcaseHeroSplitProps) {
  // Theme styling via CSS

  return (
    <section
      className={cn(
        "rounded-[1.75rem] border p-6 sm:p-8 lg:p-12",
        getSurfaceStyles("base"),
        className
      )}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
        <div className="space-y-6">
          {eyebrow && (
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                "bg-blue-100 text-blue-600",
                "dark:bg-white/10 dark:text-white/70"
              )}
            >
              {eyebrow}
            </span>
          )}
          <div className="space-y-3">
            <h2 className={cn("text-3xl font-bold sm:text-4xl", getTextColor("primary"))}>{title}</h2>
            {subtitle && (
              <p className={cn("text-base sm:text-lg", getTextColor("secondary"))}>
                {subtitle}
              </p>
            )}
          </div>

          {highlights && highlights.length > 0 && (
            <div className="space-y-4">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl p-4",
                    getGlassCard()
                  )}
                >
                  {item.icon && (
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                        "bg-blue-100 text-blue-600",
                        "dark:bg-white/10 dark:text-white"
                      )}
                    >
                      {item.icon}
                    </div>
                  )}
                  <div>
                    <h3 className={cn("text-base font-semibold", getTextColor("primary"))}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className={cn("text-sm", getTextColor("secondary"))}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {primaryAction && <ActionButton action={primaryAction} />}
            {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: secondaryAction.variant ?? "ghost" }} />}
          </div>
        </div>

        {media && (
          <div
            className={cn(
              "relative overflow-hidden rounded-[1.5rem] border p-1",
              getGlassCard()
            )}
          >
            <div className="rounded-[1.25rem] bg-gradient-to-br from-white/20 via-white/5 to-transparent p-6">
              {media}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface ShowcaseHeroBannerProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: HeroAction[];
  align?: "left" | "center";
  className?: string;
}

export function ShowcaseHeroBanner({
  title,
  subtitle,
  icon,
  actions,
  align = "center",
  className,
}: ShowcaseHeroBannerProps) {
  // Theme styling via CSS

  const alignment = align === "center" ? "text-center" : "text-left";
  const actionJustify = align === "center" ? "justify-center" : "justify-start";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border p-6 sm:p-8",
        getGlassBackground(),
        className
      )}
    >
      <div className={cn("mx-auto max-w-4xl space-y-5", alignment)}>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          {icon && (
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                "bg-white/70 text-blue-600",
                "dark:bg-black/30 dark:text-white"
              )}
            >
              {icon}
            </div>
          )}
          <div className={cn("flex-1", align === "center" ? "sm:text-center" : "sm:text-left")}>
            <h2 className={cn("text-2xl font-semibold sm:text-3xl", getTextColor("primary"))}>{title}</h2>
            {subtitle && (
              <p className={cn("mt-2 text-base", getTextColor("secondary"))}>{subtitle}</p>
            )}
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className={cn("flex flex-wrap gap-2", actionJustify)}>
            {actions.map((action) => (
              <ActionButton key={action.label} action={action} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface ShowcaseHeroDeckCard {
  title: string;
  description?: string;
  icon?: ReactNode;
  stat?: string;
  href?: string;
}

interface ShowcaseHeroDeckProps {
  title: string;
  subtitle?: string;
  cards: ShowcaseHeroDeckCard[];
  primaryAction?: HeroAction;
  className?: string;
}

export function ShowcaseHeroDeck({
  title,
  subtitle,
  cards,
  primaryAction,
  className,
}: ShowcaseHeroDeckProps) {
  // Theme styling via CSS

  return (
    <section className={cn("space-y-8", className)}>
      <div className="text-center">
        <h2 className={cn("text-3xl font-bold sm:text-4xl", getTextColor("primary"))}>{title}</h2>
        {subtitle && (
          <p className={cn("mt-2 text-base sm:text-lg", getTextColor("secondary"))}>{subtitle}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const content = (
            <div
              className={cn(
                "flex h-full flex-col gap-4 rounded-2xl border p-6",
                getGlassCard()
              )}
            >
              {card.icon && (
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-lg",
                    "bg-blue-100 text-blue-600",
                    "dark:bg-white/10 dark:text-white"
                  )}
                >
                  {card.icon}
                </div>
              )}
              <div className="space-y-2">
                <h3 className={cn("text-lg font-semibold", getTextColor("primary"))}>{card.title}</h3>
                {card.description && (
                  <p className={cn("text-sm", getTextColor("secondary"))}>{card.description}</p>
                )}
              </div>
              {card.stat && (
                <div
                  className={cn(
                    "mt-auto text-sm font-semibold uppercase tracking-[0.2em]",
                    "text-blue-600",
                    "dark:text-blue-300"
                  )}
                >
                  {card.stat}
                </div>
              )}
            </div>
          );

          if (card.href) {
            return (
              <Link key={card.title} href={card.href} className="group block h-full">
                {content}
              </Link>
            );
          }

          return (
            <div key={card.title} className="h-full">
              {content}
            </div>
          );
        })}
      </div>

      {primaryAction && (
        <div className="flex justify-center">
          <ActionButton action={primaryAction} />
        </div>
      )}
    </section>
  );
}
