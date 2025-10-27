"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { Footer } from "@/components/shared/Footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Admin routes have their own layout (AdminShell), so don't wrap them
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNavigation />
      <main className="flex-1 bg-background">{children}</main>
      <Footer />
    </div>
  );
}

