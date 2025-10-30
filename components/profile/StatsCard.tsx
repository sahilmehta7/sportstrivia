import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  href?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, className, href }: StatsCardProps) {
  const content = (
    <Card className={cn(
      "relative overflow-hidden rounded-[1.75rem] border shadow-lg transition-all duration-200 hover:scale-105",
      "bg-card/60 backdrop-blur-md border-border/60",
      href ? "cursor-pointer" : undefined,
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", glassText.badge)}>{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className={cn("text-2xl font-bold", glassText.h3)}>{value}</div>
        {subtitle && (
          <p className={cn("text-xs", glassText.subtitle)}>{subtitle}</p>
        )}
      </CardContent>
    </Card>
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
