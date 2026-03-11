"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { Footer } from "@/components/shared/Footer";
import { OnboardingExperience } from "@/components/features/onboarding/OnboardingExperience";
import { MobileAppPreOnboardingGate } from "@/components/features/onboarding/MobileAppPreOnboardingGate";

import { cn } from "@/lib/utils";
import { useMobileAppContext } from "@/hooks/useMobileAppContext";
import { usePreOnboardingState } from "@/hooks/usePreOnboardingState";

const APP_ENTRY_PATHS = ["/", "/quizzes", "/leaderboard"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDetectingMobileAppContext, isMobileAppContext } = useMobileAppContext();
  const { isHydrated, shouldShow } = usePreOnboardingState();

  // Admin routes have their own layout (AdminShell), so don't wrap them
  const isAdminRoute = pathname.startsWith('/admin');

  // Hide mobile bottom nav during quiz attempts for a cleaner interface
  const isQuizPlayRoute = pathname.startsWith('/quizzes/') && pathname.includes('/play');
  const isEligibleAppEntryPath = useMemo(() => APP_ENTRY_PATHS.includes(pathname), [pathname]);
  const shouldShowNeutralShell = isDetectingMobileAppContext && !isQuizPlayRoute;
  const shouldShowOnboardingFirst =
    !isDetectingMobileAppContext &&
    isMobileAppContext &&
    !isQuizPlayRoute &&
    isEligibleAppEntryPath &&
    isHydrated &&
    shouldShow;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (shouldShowNeutralShell) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1">
          <MobileAppPreOnboardingGate
            isDetectingMobileAppContext={isDetectingMobileAppContext}
            isMobileAppContext={isMobileAppContext}
          />
        </main>
      </div>
    );
  }

  if (shouldShowOnboardingFirst) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1">
          <MobileAppPreOnboardingGate
            isDetectingMobileAppContext={isDetectingMobileAppContext}
            isMobileAppContext={isMobileAppContext}
          />
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
      {!isAdminRoute && !isQuizPlayRoute && (
        <MobileAppPreOnboardingGate
          isDetectingMobileAppContext={isDetectingMobileAppContext}
          isMobileAppContext={isMobileAppContext}
        />
      )}
    </div>
  );
}
