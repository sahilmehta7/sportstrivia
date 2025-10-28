"use client";

import type { ReactNode } from "react";
import { ShowcasePage } from "./ShowcasePage";
import type { BackgroundVariant } from "@/lib/showcase-theme";
import type { ShowcaseBreadcrumbItem } from "./ui/Breadcrumbs";

interface ShowcaseLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  variant?: BackgroundVariant;
  breadcrumbs?: ShowcaseBreadcrumbItem[];
}

export function ShowcaseLayout({ title, subtitle, badge, variant, breadcrumbs, children }: ShowcaseLayoutProps) {
  return (
    <ShowcasePage title={title} subtitle={subtitle} badge={badge} variant={variant} breadcrumbs={breadcrumbs}>
      {children}
    </ShowcasePage>
  );
}
