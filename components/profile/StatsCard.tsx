import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function StatsCard({ title, value, subtitle, icon: Icon, className, href, variant = "cyan" }: StatsCardProps) {
  const variantStyles = {
    cyan: "shadow-neon-cyan/10 border-cyan-500/20 text-cyan-400",
    magenta: "shadow-neon-magenta/10 border-magenta-500/20 text-magenta-400",
    lime: "shadow-neon-lime/10 border-lime-500/20 text-lime-400",
  }[variant];

  const content = (
    <div className={cn(
      "relative overflow-hidden rounded-[2rem] border glass-elevated p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/5 group",
      variantStyles.split(' ')[0],
      variantStyles.split(' ')[1],
      href ? "cursor-pointer" : undefined,
      className
    )}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl glass border border-white/5 transition-colors group-hover:border-white/20",
            variantStyles.split(' ')[2]
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{title}</div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black tracking-tighter uppercase">{value}</div>
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
