import Link from "next/link";
import { getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

type PersonalizedRailSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function PersonalizedRailSectionHeader({
  eyebrow,
  title,
  subtitle,
  actionHref,
  actionLabel,
  className,
}: PersonalizedRailSectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow ? (
          <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", getTextColor("muted"))}>
            {eyebrow}
          </p>
        ) : null}
        <h2 className={cn("mt-1 text-2xl font-black uppercase tracking-tight", getTextColor("primary"))}>{title}</h2>
        {subtitle ? (
          <p className={cn("mt-1 text-sm", getTextColor("secondary"))}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex min-h-touch items-center rounded-none border border-primary/30 px-4 text-xs font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
