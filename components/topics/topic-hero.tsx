import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TopicHeroProps {
  title: string;
  subtitle?: string;
  level?: number | null;
  backgroundImageUrl?: string | null;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: Array<{ label: string; value: string | number }>;
}

export function TopicHero({
  title,
  subtitle,
  level,
  backgroundImageUrl,
  primaryCta,
  secondaryCta,
  stats,
}: TopicHeroProps) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-background to-background shadow-xl">
      {backgroundImageUrl ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImageUrl}
            alt="Topic background"
            className="h-full w-full object-cover opacity-20"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="relative flex flex-col gap-6 p-8 lg:p-12">
        {typeof level === "number" ? (
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-sm">
            Level {level}
          </Badge>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="max-w-3xl text-base text-muted-foreground lg:text-lg">{subtitle}</p>
        )}
        {stats && stats.length > 0 && (
          <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/60 bg-background/80 p-4">
                <dt className="font-medium text-muted-foreground/80">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {(primaryCta || secondaryCta) && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {primaryCta && (
              <Button asChild>
                <a href={primaryCta.href}>{primaryCta.label}</a>
              </Button>
            )}
            {secondaryCta && (
              <Button asChild variant="outline">
                <a href={secondaryCta.href}>{secondaryCta.label}</a>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
