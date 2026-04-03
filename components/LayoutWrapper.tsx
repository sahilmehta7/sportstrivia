"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { Footer } from "@/components/shared/Footer";
import { OnboardingExperience } from "@/components/features/onboarding/OnboardingExperience";
import { MobileAppPreOnboardingGate } from "@/components/features/onboarding/MobileAppPreOnboardingGate";
import { AuthInterestOnboardingGate } from "@/components/features/onboarding/AuthInterestOnboardingGate";

import { cn } from "@/lib/utils";
import { useMobileAppContext } from "@/hooks/useMobileAppContext";
import { usePreOnboardingState } from "@/hooks/usePreOnboardingState";

const APP_ENTRY_PATHS = ["/", "/quizzes", "/leaderboard"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isDetectingMobileAppContext,
    shouldShowPreOnboardingContext,
  } = useMobileAppContext();
  const { isHydrated, shouldShow } = usePreOnboardingState();

  // Admin routes have their own layout (AdminShell), so don't wrap them
  const isAdminRoute = pathname.startsWith('/admin');

  // Hide mobile bottom nav during quiz attempts for a cleaner interface
  const isQuizPlayRoute = pathname.startsWith('/quizzes/') && pathname.includes('/play');
  const isEligibleAppEntryPath = useMemo(() => APP_ENTRY_PATHS.includes(pathname), [pathname]);
  const shouldShowNeutralShell = isDetectingMobileAppContext && !isQuizPlayRoute;
  const shouldShowOnboardingFirst =
    !isDetectingMobileAppContext &&
    shouldShowPreOnboardingContext &&
    !isQuizPlayRoute &&
    isEligibleAppEntryPath &&
    isHydrated &&
    shouldShow;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (shouldShowNeutralShell) {
    return (
      <div className="public-shell flex min-h-screen flex-col overflow-x-clip bg-background">
        <main className="flex-1 min-w-0 overflow-x-clip">
          <MobileAppPreOnboardingGate
            isDetectingMobileAppContext={isDetectingMobileAppContext}
            shouldShowPreOnboardingContext={shouldShowPreOnboardingContext}
          />
        </main>
      </div>
    );
  }

  if (shouldShowOnboardingFirst) {
    return (
      <div className="public-shell flex min-h-screen flex-col overflow-x-clip bg-background">
        <main className="flex-1 min-w-0 overflow-x-clip">
          <MobileAppPreOnboardingGate
            isDetectingMobileAppContext={isDetectingMobileAppContext}
            shouldShowPreOnboardingContext={shouldShowPreOnboardingContext}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="public-shell flex min-h-screen flex-col overflow-x-clip bg-background">
      <MainNavigation />
      <main className={cn("flex-1 min-w-0 overflow-x-clip", !isQuizPlayRoute && "pb-24 lg:pb-0")}>
        {children}
      </main>
      <Footer />
      {!isQuizPlayRoute && <MobileBottomNav />}
      {!shouldShowPreOnboardingContext && !isAdminRoute && !isQuizPlayRoute && (
        <OnboardingExperience />
      )}
      {!isAdminRoute && !isQuizPlayRoute && <AuthInterestOnboardingGate />}
      {!isAdminRoute && !isQuizPlayRoute && (
        <MobileAppPreOnboardingGate
          isDetectingMobileAppContext={isDetectingMobileAppContext}
          shouldShowPreOnboardingContext={shouldShowPreOnboardingContext}
        />
      )}
    </div>
  );
}
