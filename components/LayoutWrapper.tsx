"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { Footer } from "@/components/shared/Footer";
import { OnboardingExperience } from "@/components/features/onboarding/OnboardingExperience";

import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin routes have their own layout (AdminShell), so don't wrap them
  const isAdminRoute = pathname.startsWith('/admin');

  // Hide mobile bottom nav during quiz attempts for a cleaner interface
  const isQuizPlayRoute = pathname.startsWith('/quizzes/') && pathname.includes('/play');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNavigation />
      <main className={cn("flex-1", !isQuizPlayRoute && "pb-16 lg:pb-0")}>
        {children}
      </main>
      <Footer />
      {!isQuizPlayRoute && <MobileBottomNav />}
      {!isAdminRoute && !isQuizPlayRoute && (
        <OnboardingExperience />
      )}
    </div>
  );
}

