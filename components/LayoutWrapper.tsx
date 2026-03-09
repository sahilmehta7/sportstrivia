"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { Footer } from "@/components/shared/Footer";
import { OnboardingExperience } from "@/components/features/onboarding/OnboardingExperience";
import { MobileAppPreOnboardingGate } from "@/components/features/onboarding/MobileAppPreOnboardingGate";

import { cn } from "@/lib/utils";
import { useMobileAppContext } from "@/hooks/useMobileAppContext";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDetectingMobileAppContext, isMobileAppContext } = useMobileAppContext();

  // Admin routes have their own layout (AdminShell), so don't wrap them
  const isAdminRoute = pathname.startsWith('/admin');

  // Hide mobile bottom nav during quiz attempts for a cleaner interface
  const isQuizPlayRoute = pathname.startsWith('/quizzes/') && pathname.includes('/play');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isDetectingMobileAppContext && !isQuizPlayRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className={cn("flex-1", !isQuizPlayRoute && "pb-24 lg:pb-0")}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNavigation />
      <main className={cn("flex-1", !isQuizPlayRoute && "pb-24 lg:pb-0")}>
        {children}
      </main>
      <Footer />
      {!isQuizPlayRoute && <MobileBottomNav />}
      {!isMobileAppContext && !isAdminRoute && !isQuizPlayRoute && (
        <OnboardingExperience />
      )}
      {!isAdminRoute && !isQuizPlayRoute && <MobileAppPreOnboardingGate />}
    </div>
  );
}
