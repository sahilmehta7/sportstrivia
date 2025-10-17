import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBreadcrumbSchema } from "@/lib/schema-utils";

export interface BreadcrumbItem {
  name: string;
  url?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ name: "Home", url: "/", icon: <Home className="h-3.5 w-3.5" /> }, ...items]
    : items;

  const breadcrumbSchema = getBreadcrumbSchema(allItems.map(item => ({ name: item.name, url: item.url })));

  return (
    <>
      <nav
        className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-2">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            return (
              <li key={index} className="flex items-center gap-2">
                {item.url && !isLast ? (
                  <Link
                    href={item.url}
                    className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-1.5",
                      isLast && "font-semibold text-foreground"
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </span>
                )}
                {!isLast && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

