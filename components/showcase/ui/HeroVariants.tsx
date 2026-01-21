"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getGlassCard,
  getTextColor,
  getGradientText,
} from "@/lib/showcase-theme";

type HeroAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "neon" | "glass" | "neon-magenta" | "neon-lime";
  icon?: ReactNode;
};

function ActionButton({ action }: { action: HeroAction }) {
  if (!action?.label) return null;

  const { label, href, onClick, variant = "primary", icon } = action;

  const variantMap: Record<string, any> = {
    primary: "neon",
    secondary: "glass",
    ghost: "ghost",
    neon: "neon",
    glass: "glass",
    "neon-magenta": "neon-magenta",
    "neon-lime": "neon-lime",
  };

  const buttonVariant = variantMap[variant] || "default";

  if (href) {
    return (
      <Button
        variant={buttonVariant}
        size="lg"
        asChild
        className="gap-2 font-black uppercase tracking-widest min-w-[160px]"
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
      variant={buttonVariant}
      size="lg"
      className="gap-2 font-black uppercase tracking-widest min-w-[160px]"
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
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] border px-6 py-12 sm:px-10 lg:px-16 lg:py-20",
        "glass-elevated border-primary/10 shadow-glass-lg",
        className
      )}
    >
      {backgroundImageUrl && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImageUrl}
            alt=""
            className="h-full w-full object-cover opacity-10 mix-blend-overlay"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/40 to-transparent" />
        </div>
      )}

      {/* Decorative neon pulse */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-pulse-glow pointer-events-none" />

      <div className="relative flex flex-col gap-12 sm:gap-16">
        <div className="space-y-6 text-center lg:text-left">
          {eyebrow && (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.4em]",
                "bg-primary/10 text-primary border border-primary/20 shadow-neon-cyan"
              )}
            >
              {eyebrow}
            </span>
          )}
          <h1
            className={cn(
              "mx-auto max-w-4xl text-4xl font-black tracking-tighter sm:text-6xl lg:text-7xl lg:mx-0",
              "text-foreground leading-[0.9]"
            )}
          >
            {title}<br />
            {highlightedText && (
              <span className={cn("block mt-2", getGradientText("neon"))}>
                {highlightedText}
              </span>
            )}
          </h1>
          {subtitle && (
            <p
              className={cn(
                "mx-auto max-w-2xl text-base sm:text-xl lg:mx-0 leading-relaxed font-medium",
                "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 lg:justify-start">
          {primaryAction && <ActionButton action={{ ...primaryAction, variant: primaryAction.variant ?? "primary" }} />}
          {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: secondaryAction.variant ?? "secondary" }} />}
        </div>

        {stats && stats.length > 0 && (
          <dl className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl px-4 py-6 text-center lg:text-left",
                  "glass border-white/5 shadow-sm transition-transform hover:scale-105"
                )}
              >
                <dt className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80 mb-1">
                  {stat.label}
                </dt>
                <dd className={cn("text-2xl font-black tracking-tight", getTextColor("primary"))}>
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

// ... existing ShowcaseHeroSplit, ShowcaseHeroBanner, ShowcaseHeroDeck updated to match theme ...
// (I will update these as well to ensure consistency across the showcase)

export function ShowcaseHeroSplit({
  eyebrow,
  title,
  subtitle,
  highlights,
  media,
  primaryAction,
  secondaryAction,
  className,
}: any) {
  return (
    <section
      className={cn(
        "rounded-[2.5rem] border p-8 lg:p-16",
        "glass-elevated border-primary/10 shadow-glass-lg",
        className
      )}
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8">
          {eyebrow && (
            <span className="inline-flex rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.4em] bg-secondary/10 text-secondary border border-secondary/20 shadow-neon-magenta">
              {eyebrow}
            </span>
          )}
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter sm:text-5xl leading-none">{title}</h2>
            {subtitle && (
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {highlights && highlights.length > 0 && (
            <div className="grid gap-4">
              {highlights.map((item: any) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl p-4 glass border-white/5 transition-colors hover:bg-white/5"
                >
                  {item.icon && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-neon-cyan">
                      {item.icon}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {primaryAction && <ActionButton action={primaryAction} />}
            {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: secondaryAction.variant ?? "glass" }} />}
          </div>
        </div>

        {media && (
          <div className="relative aspect-square sm:aspect-video lg:aspect-square overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
            {media}
          </div>
        )}
      </div>
    </section>
  );
}

export function ShowcaseHeroBanner({
  title,
  subtitle,
  icon,
  actions,
  align = "center",
  className,
}: any) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";
  const actionJustify = align === "center" ? "justify-center" : "justify-start";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[2.5rem] border p-8 sm:p-12",
        "glass border-accent/20 shadow-neon-lime/20",
        className
      )}
    >
      <div className={cn("mx-auto max-w-4xl flex flex-col gap-6", alignment)}>
        {icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-neon-lime">
            {icon}
          </div>
        )}
        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tighter sm:text-4xl leading-none">{title}</h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground font-medium">{subtitle}</p>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className={cn("flex flex-wrap gap-4", actionJustify)}>
            {actions.map((action: any) => (
              <ActionButton key={action.label} action={action} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ShowcaseHeroDeck({
  title,
  subtitle,
  cards,
  primaryAction,
  className,
}: any) {
  return (
    <section className={cn("space-y-12", className)}>
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tighter sm:text-5xl">{title}</h2>
        {subtitle && (
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground font-medium">{subtitle}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card: any) => (
          <Link
            key={card.title}
            href={card.href || "#"}
            className="group flex flex-col gap-6 rounded-[2rem] border border-white/5 bg-white/5 p-8 transition-all duration-300 hover:border-primary/30 hover:bg-white/10 hover:-translate-y-2 hover:shadow-neon-cyan/20"
          >
            {card.icon && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-2xl group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
            )}
            <div className="space-y-3">
              <h3 className="text-2xl font-black tracking-tight">{card.title}</h3>
              {card.description && (
                <p className="text-base text-muted-foreground line-clamp-3">{card.description}</p>
              )}
            </div>
            {card.stat && (
              <div className="mt-auto pt-4 border-t border-white/5 font-black uppercase tracking-widest text-[10px] text-primary">
                {card.stat}
              </div>
            )}
          </Link>
        ))}
      </div>

      {primaryAction && (
        <div className="flex justify-center">
          <ActionButton action={primaryAction} />
        </div>
      )}
    </section>
  );
}
