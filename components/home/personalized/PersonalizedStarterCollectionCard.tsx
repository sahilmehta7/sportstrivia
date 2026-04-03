import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PersonalizedHomeStarterCollection } from "@/types/personalized-home";
import { getSurfaceStyles } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

type PersonalizedStarterCollectionCardProps = {
  collection: PersonalizedHomeStarterCollection;
};

export function PersonalizedStarterCollectionCard({ collection }: PersonalizedStarterCollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className={cn(
        "group relative flex min-h-[220px] flex-col overflow-hidden rounded-none transition-transform duration-base ease-smooth hover:-translate-y-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        getSurfaceStyles("base")
      )}
      aria-label={`Open starter collection ${collection.name}`}
    >
      {collection.coverImageUrl ? (
        <Image
          src={collection.coverImageUrl}
          alt={collection.name}
          fill
          className="absolute inset-0 object-cover opacity-25 transition-transform duration-slow group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 82vw, (max-width: 1280px) 33vw, 24vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-accent/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />

      <div className="relative z-10 mt-auto p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Starter Collection
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-black uppercase tracking-tight">{collection.name}</h3>
        {collection.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
        ) : null}
        <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
          Explore
          <ArrowRight className="h-4 w-4 transition-transform duration-base group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
