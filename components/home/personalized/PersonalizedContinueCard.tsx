import type { PersonalizedHomeContinueItem } from "@/types/personalized-home";
import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";

type PersonalizedContinueCardProps = {
  item: PersonalizedHomeContinueItem;
};

export function PersonalizedContinueCard({ item }: PersonalizedContinueCardProps) {
  const statusLabel = `${item.lastPlayedLabel.toUpperCase()} · ${item.streak}D STREAK`;

  return (
    <Link
      href={`/quizzes/${item.slug}`}
      className="group block h-full overflow-hidden border border-foreground/10 bg-card transition-colors hover:border-foreground/30"
      aria-label={`Resume ${item.title}`}
    >
      <div className="flex items-center gap-3 p-2.5">
        <div className="relative h-14 w-20 shrink-0 overflow-hidden border border-foreground/10 bg-muted">
          {item.coverImageUrl ? (
            <Image
              src={item.coverImageUrl}
              alt={item.title}
              fill
              className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.04]"
              sizes="80px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-accent/10" />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-1 text-sm font-black uppercase tracking-tight leading-tight">{item.title}</h3>
          <div className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            <Clock3 className="h-2.5 w-2.5" />
            <span className="truncate">{statusLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
