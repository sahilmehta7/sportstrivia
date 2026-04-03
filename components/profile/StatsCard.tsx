
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  href?: string;
  variant?: "cyan" | "magenta" | "lime";
  flat?: boolean;
  compact?: boolean;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  href,
  variant = "cyan",
  flat = false,
  compact = false,
}: StatsCardProps) {
  const variantStyles = {
    cyan: "shadow-neon-cyan/10 border-cyan-500/20 text-cyan-400",
    magenta: "shadow-neon-magenta/10 border-magenta-500/20 text-magenta-400",
    lime: "shadow-neon-lime/10 border-lime-500/20 text-lime-400",
  }[variant];

  const content = (
    <div className={cn(
      "relative overflow-hidden border transition-all duration-300 group",
      flat
        ? "rounded-none bg-card border-border shadow-none"
        : "rounded-[2rem] glass-elevated hover:scale-[1.02] hover:bg-white/5",
      compact ? "p-4" : "p-6",
      variantStyles.split(' ')[0],
      variantStyles.split(' ')[1],
      href ? "cursor-pointer" : undefined,
      className
    )}>
      <div className={cn("flex flex-col", compact ? "gap-3" : "gap-4")}>
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex items-center justify-center border transition-colors group-hover:border-white/20",
            compact ? "h-8 w-8" : "h-10 w-10",
            flat ? "rounded-none bg-muted/40 border-border" : "rounded-xl glass border-white/5",
            variantStyles.split(' ')[2]
          )}>
            <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{title}</div>
        </div>

        <div className="space-y-1">
          <div className={cn("font-black tracking-tighter uppercase", compact ? "text-2xl" : "text-3xl")}>{value}</div>
          {subtitle && (
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Subtle bottom glow */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20",
        variantStyles.split(' ')[2]
      )} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${title} - view details`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
